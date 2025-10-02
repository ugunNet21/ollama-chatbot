# Chat Bot Application

## About
This is a chat bot application powered by Ollama, designed to provide an interactive conversational experience using various AI models.

## Installation

To set up the application, follow these steps:

1. **Install Ollama**  
   Download and install Ollama by running the following command:
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```

2. **Pull AI Models**  
   Use the `ollama pull` command to download the desired model. Available models include:
   ```bash
   ollama pull gemma2:2b
   ollama pull gemma2:9b
   ollama pull gemma2:27b
   ollama pull deepseek-r1
   ```
   Choose the model that best suits your needs based on performance and resource requirements.

## Usage

To run the chat bot application:

1. **Start the Ollama Server**  
   Launch the Ollama server in the background:
   ```bash
   ollama serve
   ```

2. **Run the Application**  
   Use `nodemon` to start the application server, which will automatically restart on file changes:
   ```bash
   nodemon server.js
   ```

## Notes
- Ensure you have Node.js and `nodemon` installed globally (`npm install -g nodemon`) before running the application.
- The `ollama pull` command is used to download models, while `ollama run` is used to interact with a model directly from the command line.
- For more information on available models and their specifications, visit the [Ollama documentation](https://ollama.com/docs).