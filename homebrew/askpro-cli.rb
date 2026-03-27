class AskproCli < Formula
  desc "AI-powered document analysis with 85+ expert consultation roles"
  homepage "https://github.com/marcelrgberger/askpro-cli"
  url "https://github.com/marcelrgberger/askpro-cli/archive/refs/tags/v0.3.0.tar.gz"
  sha256 "09430a0286b79827f2ba346b4b09cebe7e3e5bbd15130cc7910baff320ce462c"
  license "MIT"

  depends_on "node@22"

  def install
    # Install dependencies and build
    system "npm", "ci"
    system "npm", "run", "build"

    # Install to libexec
    libexec.install "dist", "src/roles", "node_modules", "package.json"

    # Create wrapper script
    (bin/"askpro").write <<~SH
      #!/bin/bash
      exec "#{Formula["node@22"].opt_bin}/node" "#{libexec}/dist/askpro-cli.js" "$@"
    SH
  end

  def caveats
    <<~EOS
      To use askpro, you need an OpenAI API key:
        export OPENAI_API_KEY="sk-..."

      Or pass it on startup:
        askpro --api-key "sk-..."

      Documentation: https://github.com/marcelrgberger/askpro-cli
    EOS
  end

  test do
    assert_match "askpro", shell_output("#{bin}/askpro --help")
  end
end
