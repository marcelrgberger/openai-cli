class OpenaiCli < Formula
  desc "AI-powered document analysis with 65+ expert consultation roles"
  homepage "https://github.com/marcelrgberger/openai-cli"
  url "https://github.com/marcelrgberger/openai-cli/archive/refs/tags/v0.1.0.tar.gz"
  sha256 "PLACEHOLDER"
  license "MIT"

  depends_on "node@22"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]

    # Copy role definitions
    (share/"openai-cli/roles").install Dir["src/roles/**/*.md"]
  end

  def caveats
    <<~EOS
      Um openai-cli zu verwenden, brauchst du einen OpenAI API-Key:
        export OPENAI_API_KEY="sk-..."

      Oder beim Start:
        openai-cli --api-key "sk-..."

      Dokumentation: https://github.com/marcelrgberger/openai-cli
    EOS
  end

  test do
    assert_match "openai-cli", shell_output("#{bin}/openai-cli --help")
  end
end
