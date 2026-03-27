class AskaproCli < Formula
  desc "Ask a Pro — AI-powered document analysis with 85+ expert consultation roles"
  homepage "https://github.com/marcelrgberger/askapro-cli"
  url "https://github.com/marcelrgberger/askapro-cli/archive/refs/tags/v0.5.3.tar.gz"
  sha256 "PLACEHOLDER"
  license "MIT"

  depends_on "node@22"

  def install
    # Install dependencies and build
    system "npm", "ci"
    system "npm", "run", "build"

    # Install to libexec
    libexec.install "dist", "src/roles", "node_modules", "package.json"

    # Create wrapper script
    (bin/"askapro").write <<~SH
      #!/bin/bash
      exec "#{Formula["node@22"].opt_bin}/node" "#{libexec}/dist/askapro-cli.js" "$@"
    SH
  end

  def caveats
    <<~EOS
      To use askapro, you need an OpenAI API key:
        export OPENAI_API_KEY="sk-..."

      Or pass it on startup:
        askapro --api-key "sk-..."

      Documentation: https://github.com/marcelrgberger/askapro-cli
    EOS
  end

  test do
    assert_match "askapro", shell_output("#{bin}/askapro --help")
  end
end
