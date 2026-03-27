class AskproCli < Formula
  desc "AI-powered document analysis with 85+ expert consultation roles"
  homepage "https://github.com/marcelrgberger/askpro-cli"
  url "https://github.com/marcelrgberger/askpro-cli/archive/refs/tags/v0.2.0.tar.gz"
  sha256 "PLACEHOLDER"
  license "MIT"

  depends_on "node@22"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]

    # Copy role definitions
    (share/"askpro-cli/roles").install Dir["src/roles/**/*.md"]
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
