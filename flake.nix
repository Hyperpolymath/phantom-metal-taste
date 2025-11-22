{
  description = "Phantom Metal Taste - Multi-Model Database Architecture";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = { self, nixpkgs, flake-utils, rust-overlay }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs {
          inherit system overlays;
        };

        # Rust toolchain with WASM target
        rustToolchain = pkgs.rust-bin.stable.latest.default.override {
          extensions = [ "rust-src" "rustfmt" "clippy" ];
          targets = [ "wasm32-unknown-unknown" ];
        };

        # ReScript compiler
        rescript = pkgs.buildNpmPackage {
          pname = "rescript";
          version = "11.0.0";
          src = pkgs.fetchFromGitHub {
            owner = "rescript-lang";
            repo = "rescript-compiler";
            rev = "11.0.0";
            hash = "sha256:PLACEHOLDER"; # Update with actual hash
          };
          npmDepsHash = "sha256:PLACEHOLDER";
        };

      in
      {
        # Development shell
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Core tools
            deno
            just
            git

            # ReScript
            nodejs
            # rescript  # Uncomment when package is available

            # Rust/WASM
            rustToolchain
            wasm-pack
            wasm-bindgen-cli

            # Julia
            julia-bin

            # Databases
            docker
            docker-compose

            # Documentation
            plantuml
            graphviz

            # Development tools
            watchexec
            ripgrep
            fd
            jq

            # Optional but useful
            httpie  # Better curl
            nushell # Modern shell
          ];

          shellHook = ''
            echo "🌀 Phantom Metal Taste Development Environment"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "Available tools:"
            echo "  • Deno: $(deno --version | head -1)"
            echo "  • Rust: $(rustc --version)"
            echo "  • Julia: $(julia --version)"
            echo "  • Just: $(just --version)"
            echo "  • Docker: $(docker --version)"
            echo ""
            echo "Quick commands:"
            echo "  just build      - Build ReScript code"
            echo "  just dev        - Run development server"
            echo "  just test       - Run tests"
            echo "  just db-up      - Start databases"
            echo "  just rsr-verify - Check RSR compliance"
            echo "  just --list     - Show all commands"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

            # Set up environment variables
            export DENO_DIR="$PWD/.deno"
            export CARGO_HOME="$PWD/.cargo"

            # Add local bins to PATH
            export PATH="$PWD/node_modules/.bin:$PATH"

            # Install ReScript if not present
            if [ ! -f "node_modules/.bin/rescript" ]; then
              echo "📦 Installing ReScript compiler..."
              npm install --save-dev rescript@latest
            fi
          '';

          # Rust-specific environment
          RUST_SRC_PATH = "${rustToolchain}/lib/rustlib/src/rust/library";
          CARGO_BUILD_TARGET = "wasm32-unknown-unknown";
        };

        # Build the project
        packages.default = pkgs.stdenv.mkDerivation {
          name = "phantom-metal-taste";
          version = "0.1.0";
          src = ./.;

          buildInputs = with pkgs; [
            deno
            nodejs
            rustToolchain
          ];

          buildPhase = ''
            # Install ReScript
            npm install --save-dev rescript

            # Build ReScript → JavaScript
            npx rescript build

            # Build Rust → WASM
            cd src/core
            cargo build --target wasm32-unknown-unknown --release
            cd ../..
          '';

          installPhase = ''
            mkdir -p $out
            cp -r src $out/
            cp -r lib $out/
            cp -r docs $out/
            cp deno.json $out/
            cp bsconfig.json $out/
            cp justfile $out/
            cp LICENSE $out/
            cp README.md $out/
          '';

          meta = with pkgs.lib; {
            description = "Multi-model database architecture for measuring organizational intention-reality gaps";
            homepage = "https://github.com/Hyperpolymath/phantom-metal-taste";
            license = licenses.mit;
            platforms = platforms.unix;
            maintainers = [ ];
          };
        };

        # Docker image (optional)
        packages.dockerImage = pkgs.dockerTools.buildLayeredImage {
          name = "phantom-metal-taste";
          tag = "latest";

          contents = with pkgs; [
            deno
            self.packages.${system}.default
          ];

          config = {
            Cmd = [ "${pkgs.deno}/bin/deno" "run" "--allow-net" "--allow-env" "--allow-read" "src/orchestrator/Index.bs.js" ];
            ExposedPorts = {
              "3000/tcp" = {};
            };
            Env = [
              "PORT=3000"
              "NODE_ENV=production"
            ];
          };
        };

        # CI/CD apps
        apps.default = flake-utils.lib.mkApp {
          drv = self.packages.${system}.default;
        };

        # Checks (run with `nix flake check`)
        checks = {
          # Type check
          typecheck = pkgs.runCommand "typecheck" {
            buildInputs = [ self.devShells.${system}.default ];
          } ''
            cd ${self}
            rescript build
            cd src/core && cargo check
            touch $out
          '';

          # Run tests
          test = pkgs.runCommand "test" {
            buildInputs = [ self.devShells.${system}.default ];
          } ''
            cd ${self}
            rescript build
            deno test --allow-net --allow-env --allow-read tests/
            cd src/core && cargo test
            touch $out
          '';

          # RSR compliance verification
          rsr-verify = pkgs.runCommand "rsr-verify" {} ''
            cd ${self}

            # Check required files
            test -f README.md || exit 1
            test -f LICENSE || exit 1
            test -f SECURITY.md || exit 1
            test -f CODE_OF_CONDUCT.md || exit 1
            test -f CONTRIBUTING.md || exit 1
            test -f MAINTAINERS.md || exit 1
            test -f CHANGELOG.md || exit 1
            test -f .well-known/security.txt || exit 1
            test -f .well-known/ai.txt || exit 1
            test -f .well-known/humans.txt || exit 1
            test -f justfile || exit 1
            test -f flake.nix || exit 1

            echo "RSR compliance: VERIFIED" > $out
          '';
        };

        # Formatter
        formatter = pkgs.alejandra;
      }
    );
}
