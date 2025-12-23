{
  description = "The Sidekicks - Elite AI coding squad for OpenCode";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    let
      # Home-manager module (system-agnostic)
      hmModule = import ./nix/hm-module.nix { inherit self; };
    in
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        packages = {
          default = self.packages.${system}.opencode-sidekicks;

          opencode-sidekicks = pkgs.stdenv.mkDerivation {
            pname = "opencode-sidekicks";
            version = "0.1.0";

            src = self;

            nativeBuildInputs = [ pkgs.bun ];

            buildPhase = ''
              runHook preBuild
              export HOME=$TMPDIR
              bun install --frozen-lockfile
              bun run build
              runHook postBuild
            '';

            installPhase = ''
              runHook preInstall
              mkdir -p $out
              cp -r dist $out/
              cp -r agents $out/
              cp -r skills $out/
              cp package.json $out/
              runHook postInstall
            '';

            meta = with pkgs.lib; {
              description = "The Sidekicks - Elite AI coding specialists for OpenCode";
              homepage = "https://github.com/trash-panda-v91-beta/the-sidekicks";
              license = licenses.mit;
              platforms = platforms.unix;
            };
          };
        };

        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            bun
            nodejs_22
            typescript
          ];
        };
      }
    )
    // {
      # Home-manager module output (not per-system)
      homeManagerModules = {
        default = hmModule;
        the-sidekicks = hmModule;
      };

      # For backwards compatibility
      homeManagerModule = hmModule;
    };
}
