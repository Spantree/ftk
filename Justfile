# Fluent Toolkit Development Tasks
# https://github.com/casey/just

# Default recipe to display help
default:
    @just --list

# Development Tasks
# ==================

# Run ftk init in development mode
dev *ARGS:
    deno run --allow-all --unstable-raw-imports src/main.ts {{ARGS}}

# Type check the project
check:
    deno check --unstable-raw-imports src/main.ts

# Format code
fmt:
    deno fmt

# Lint code
lint:
    deno lint

# Run all checks (type, lint, format)
validate: check lint
    deno fmt --check

# Compile binaries
compile:
    deno task compile

# Compile for all platforms
compile-all:
    deno task compile:all

# Testing
# ==================

# Run unit tests
test-unit:
    deno run --allow-all tests/unit/**/*.test.ts

# Run Claude Code check unit tests
test-claude-checks:
    @echo "Running version scenarios..."
    @deno run --allow-all tests/unit/claude-code-checks/claude-version-scenarios.test.ts
    @echo "\nRunning changelog tests..."
    @deno run --allow-net tests/unit/claude-code-checks/changelog.test.ts
    @echo "\nRunning install method detection..."
    @deno run --allow-all tests/unit/claude-code-checks/install-method-detection.test.ts

# Run integration tests (requires Tart VM setup)
test-integration:
    deno task test:integration

# Run server validation tests (requires Tart VM with Claude Code installed)
test-server-validation:
    deno test --allow-all tests/integration/scenarios/server-validation/

# Run specific server validation test
test-server SERVER:
    deno test --allow-all tests/integration/scenarios/server-validation/{{SERVER}}.test.ts

# VM Management (Tart)
# ==================

# Install Tart (macOS only)
install-tart:
    @echo "Installing Tart..."
    brew install tart

# Pull base macOS image
vm-pull-base:
    @echo "Pulling macOS Sequoia base image..."
    tart clone ghcr.io/cirruslabs/macos-sequoia-base:latest sequoia-base

# Create and configure FTK test VM
vm-setup VM_NAME="FTK-test": vm-pull-base
    @echo "Creating VM: {{VM_NAME}}"
    @if tart list | grep -q "{{VM_NAME}}"; then \
        echo "VM {{VM_NAME}} already exists. Deleting..."; \
        tart delete {{VM_NAME}}; \
    fi
    tart clone sequoia-base {{VM_NAME}}
    @echo "\nStarting VM..."
    tart run --no-graphics {{VM_NAME}} &
    @sleep 10
    @echo "\nConfiguring Homebrew PATH..."
    tart exec {{VM_NAME}} /bin/zsh -c "echo 'eval \"\$$(/opt/homebrew/bin/brew shellenv)\"' >> ~/.zshrc"
    @echo "\nInstalling dependencies (node, python, uv)..."
    tart exec {{VM_NAME}} /bin/zsh -c "source ~/.zshrc && brew install node python uv"
    @echo "\n✅ VM {{VM_NAME}} is ready for testing"
    @echo "\nVM IP: $$(tart ip {{VM_NAME}})"
    @echo "\nTo connect: ssh admin@$$(tart ip {{VM_NAME}})"
    @echo "To stop: tart stop {{VM_NAME}}"

# Start test VM
vm-start VM_NAME="FTK-test":
    @echo "Starting VM: {{VM_NAME}}"
    tart run --no-graphics {{VM_NAME}} &
    @sleep 5
    @echo "VM IP: $$(tart ip {{VM_NAME}})"

# Stop test VM
vm-stop VM_NAME="FTK-test":
    @echo "Stopping VM: {{VM_NAME}}"
    tart stop {{VM_NAME}}

# Get VM IP address
vm-ip VM_NAME="FTK-test":
    @tart ip {{VM_NAME}}

# SSH into test VM
vm-ssh VM_NAME="FTK-test":
    @ssh admin@$$(tart ip {{VM_NAME}})

# Delete test VM
vm-delete VM_NAME="FTK-test":
    @echo "Deleting VM: {{VM_NAME}}"
    @if tart list | grep -q "{{VM_NAME}}"; then \
        tart stop {{VM_NAME}} 2>/dev/null || true; \
        tart delete {{VM_NAME}}; \
        echo "✅ VM {{VM_NAME}} deleted"; \
    else \
        echo "VM {{VM_NAME}} does not exist"; \
    fi

# List all VMs
vm-list:
    @tart list

# Clean up all test VMs (dangerous!)
vm-clean:
    @echo "⚠️  This will delete ALL VMs starting with 'FTK-'"
    @read -p "Are you sure? [y/N] " -n 1 -r; \
    if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
        echo "\nCleaning up test VMs..."; \
        tart list | grep "FTK-" | awk '{print $$1}' | xargs -I {} just vm-delete {}; \
    else \
        echo "\nCancelled"; \
    fi

# === Testing ===

# Test ftk init on host (recommended)
test-init *ARGS:
    @echo "Testing ftk init on host (isolated /tmp directory)..."
    deno run --allow-all --unstable-raw-imports scripts/test-init.ts {{ARGS}}

# Test ftk init with sequential module
test-init-sequential:
    @echo "Testing sequential module setup..."
    deno run --allow-all --unstable-raw-imports scripts/test-init.ts --modules sequential --no-prompt --keep

# Launch interactive shell in test project
test-shell *ARGS:
    deno run --allow-all scripts/test-shell.ts {{ARGS}}

# === Docker Testing ===

# Build Docker test image
test-docker-build:
    @echo "Building Docker test image..."
    docker compose -f tests/docker/docker-compose.yml build

# Run interactive shell in Docker test container
test-docker-shell:
    @echo "Starting interactive shell in test container..."
    docker compose -f tests/docker/docker-compose.yml run --rm ftk-test bash

# Test ftk init in Docker container
test-docker-init:
    @echo "Testing ftk init in Docker container..."
    docker compose -f tests/docker/docker-compose.yml run --rm ftk-test bash -c "\
        ftk init --modules sequential --no-prompt && \
        echo '\n=== Verifying MCP servers ===' && \
        cdsp mcp list"

# Clean up Docker containers and volumes
test-docker-clean:
    @echo "Cleaning up Docker test environment..."
    docker compose -f tests/docker/docker-compose.yml down -v
    @echo "✅ Docker test environment cleaned"

# Install ftk in VM from local build
vm-install-ftk VM_NAME="FTK-test": compile
    #!/usr/bin/env bash
    set -euo pipefail
    echo "Installing ftk in VM: {{VM_NAME}}"
    VM_IP=$(tart ip {{VM_NAME}})
    scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        bin/ftk admin@$VM_IP:/tmp/ftk
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        admin@$VM_IP "sudo mv /tmp/ftk /usr/local/bin/ftk && sudo chmod +x /usr/local/bin/ftk"
    echo "✅ ftk installed in VM"

# Test ftk in VM
vm-test-ftk VM_NAME="FTK-test" WORKDIR="/tmp/ftk-test":
    @echo "Testing ftk in VM: {{VM_NAME}}"
    @ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        admin@$$(tart ip {{VM_NAME}}) \
        "rm -rf {{WORKDIR}} && mkdir -p {{WORKDIR}} && cd {{WORKDIR}} && ftk init --no-prompt"

# Setup VM with all prerequisites for server validation tests
vm-test-setup VM_NAME="FTK-test": vm-start vm-install-ftk
    #!/usr/bin/env bash
    set -euo pipefail
    echo "Installing Claude Code in VM..."
    VM_IP=$(tart ip {{VM_NAME}})
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        admin@$VM_IP \
        "source ~/.zshrc && npm install -g @anthropic-ai/claude-code"
    echo ""
    echo "✅ VM ready for server validation tests"
    echo ""
    echo "VM IP: $VM_IP"
    echo "To run tests: TEST_VM_IP=$VM_IP just test-server-validation"

# Release Tasks
# ==================

# Create a new release
release VERSION:
    @echo "Creating release {{VERSION}}"
    ./scripts/release.sh {{VERSION}}

# Update Homebrew formula checksums
update-formula:
    @echo "Updating Homebrew formula checksums..."
    @echo "Run this after creating GitHub release with binaries"
    @echo "1. Download artifacts from GitHub release"
    @echo "2. Run: shasum -a 256 ftk-*"
    @echo "3. Update Formula/fluent-toolkit.rb"

# Documentation
# ==================

# Format markdown files with prettier
fmt-docs:
    npx prettier --write "**/*.md"

# Format Basic Memory notes
fmt-memory:
    npx prettier --write "context/basic-memory/**/*.md"

# Utility Tasks
# ==================

# Clean build artifacts
clean:
    rm -f ftk ftk-*
    rm -rf .ftk/

# Show project info
info:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "Fluent Toolkit Development Environment"
    echo "======================================"
    echo ""
    echo "Deno version: $(deno --version | head -1)"
    echo "Node version: $(node --version 2>/dev/null || echo 'not installed')"
    echo "Tart version: $(tart --version 2>/dev/null || echo 'not installed')"
    echo ""
    echo "Run 'just' to see available commands"

# Open project in editor
edit:
    code .

# Quick test workflow: validate, compile, and test
quick-test: validate compile test-claude-checks
    @echo "\n✅ Quick test completed successfully"

# Full test workflow: validate, compile, unit tests, integration tests
full-test: validate compile test-unit test-integration
    @echo "\n✅ Full test completed successfully"
