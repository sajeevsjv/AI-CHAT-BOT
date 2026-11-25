# 🤖 Reveforge AI Chatbot - ReveBot

An AI-powered website chatbot built using the **MERN Stack, Google Gemini API, MongoDB Atlas Vector Search, and Retrieval-Augmented Generation (RAG)**.

The chatbot retrieves relevant information from multiple knowledge sources, including the Reveforge website and custom course curriculum Markdown files, using semantic search. It then uses Google Gemini to generate context-aware responses.

This project demonstrates how modern AI applications combine traditional web development with embeddings, vector databases, semantic search, and Large Language Models (LLMs).

---

## ✨ Features

- **AI-Powered Conversations:** Generate natural-language responses using Google Gemini.
- **Retrieval-Augmented Generation (RAG):** Retrieve relevant information before generating responses.
- **Text Embeddings:** Convert website content and course documents into numerical vector representations.
- **Semantic Search:** Find relevant information based on meaning rather than exact keyword matching.
- **MongoDB Atlas Vector Search:** Store and retrieve vector embeddings efficiently.
- **Website Content Ingestion:** Automatically extract and process website content using sitemap URLs.
- **Custom Course Curriculum Ingestion:** Process custom course curriculum content maintained in Markdown (`.md`) files.
- **Multi-Source Knowledge Base:** Retrieve information from both website content and custom course curriculum documents.
- **Incremental Ingestion:** Detect new or modified website content and update the knowledge base.
- **Conversation Management:** Create, retrieve, and delete conversations.
- **Chat History:** Maintain previous messages for contextual follow-up questions.
- **Source References:** Provide references to relevant website pages.
- **Multilingual Support:** Support English, Malayalam, and Manglish responses.
- **Context-Aware Responses:** Use previous conversation messages to understand follow-up questions.

---

## 🛠️ Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS 4
- Axios

### Backend
- Node.js
- Express.js 5
- MongoDB
- Mongoose
- Google GenAI SDK

### AI & RAG
- Google Gemini API
- Gemini Embedding Models
- Vector Embeddings
- MongoDB Atlas Vector Search
- Retrieval-Augmented Generation (RAG)
- Cheerio for website content extraction
- Markdown-based document ingestion

### Development Tools
- Git & GitHub
- pnpm
- VS Code
- Postman

---

## 🏗️ Project Structure

```text
AI-CHAT-BOT/
│
├── client/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── controllers/
│   │
│   ├── db/
│   │   ├── models/
│   │   └── mongoConnect.js
│   │
│   ├── routes/
│   │   └── chatRoutes.js
│   │
│   ├── services/
│   │   ├── embeddingService.js
│   │   ├── ragService.js
│   │   └── geminiService.js
│   │
│   ├── scripts/
│   │   └── ingest.js
│   │
│   ├── app.js
│   └── package.json
│
├── .gitignore
└── README.md
```

*Note: The structure above highlights the main application components. Actual folders and filenames may vary.*

---

## 🧠 Understanding RAG (Retrieval-Augmented Generation)

RAG is an architecture that allows an AI application to retrieve information from an external knowledge source before generating a response.

Instead of depending only on the information learned during model training, the chatbot retrieves relevant information from its own knowledge base.

This project uses two major processes:

### 1. Data Ingestion Pipeline

The ingestion pipeline collects information from multiple sources, processes the content, generates embeddings, and stores the results in MongoDB Atlas.

#### Knowledge Source 1: Website Content

- Fetch website URLs from the sitemap.
- Download website pages.
- Extract relevant HTML content using Cheerio.
- Clean unnecessary HTML elements and text.
- Divide the extracted content into smaller chunks.
- Generate vector embeddings for each chunk.
- Store text, metadata, and embeddings in MongoDB.

#### Knowledge Source 2: Custom Course Curriculum

- Maintain custom course curriculum content in Markdown (`.md`) files.
- Read and process the Markdown files.
- Extract meaningful text content.
- Divide the content into smaller chunks.
- Generate vector embeddings for each chunk.
- Store the processed content and embeddings in MongoDB Atlas.

#### Ingestion Architecture

```text
             KNOWLEDGE SOURCES
                     |
          +----------+----------+
          |                     |
          v                     v
    Reveforge Website      Course Curriculum
       (HTML)                  (.md)
          |                     |
          v                     v
     Cheerio Extraction    Markdown Processing
          |                     |
          +----------+----------+
                     |
                     v
               Text Cleaning
                     |
                     v
                Chunking
                     |
                     v
             Gemini Embeddings
                     |
                     v
               Vector Storage
                     |
                     v
                MongoDB Atlas
```

### 2. User Query and Retrieval Pipeline

When a user asks a question, the application retrieves relevant information from the MongoDB knowledge base before sending the context to Gemini.

```text
             User Question
                   |
                   v
          Generate Embedding
                   |
                   v
             Query Vector
                   |
                   v
         MongoDB Vector Search
                   |
                   v
        Retrieve Relevant Chunks
                   |
                   v
          Prepare RAG Context
                   |
                   v
           Gemini API Request
                   |
                   v
          Generate AI Response
                   |
                   v
             Chat Interface
```

**Steps involved:**

1. Receive the user's question.
2. Convert the question into a vector embedding.
3. Search for semantically similar vectors in MongoDB.
4. Retrieve relevant website or course curriculum content.
5. Prepare a prompt containing the retrieved context and conversation history.
6. Send the prompt to Google Gemini.
7. Generate a context-aware response.
8. Return the response and relevant source references to the frontend.

---

## 📚 Important AI & RAG Concepts

| Concept | Explanation |
|---|---|
| LLM | Large Language Model used to understand and generate text. |
| Embeddings | Numerical representations of text meaning. |
| Vector | An array of numerical values representing an embedding. |
| Chunking | Dividing large documents into smaller text sections. |
| Chunk Overlap | Repeating a portion of text between adjacent chunks to preserve context. |
| Vector Database | Database used to store and search vector representations. |
| Semantic Search | Searching based on meaning rather than exact words. |
| Vector Search | Finding similar vectors using mathematical similarity measures. |
| RAG | Retrieving external information before generating an AI response. |
| Context Window | The amount of information a model can process in one request. |
| Prompt Engineering | Designing instructions and context for an AI model. |
| Hallucination | When an AI generates incorrect or unsupported information. |

---

## ⚙️ Installation & Setup

### Prerequisites

Make sure you have installed:

- Node.js
- pnpm
- MongoDB Atlas account
- Google Gemini API key
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/sajeevsjv/AI-CHAT-BOT.git

cd AI-CHAT-BOT
```

### 2. Backend Setup

Navigate to the server directory:

```bash
cd server
```

Install dependencies:

```bash
pnpm install
```

Create a `.env` file inside the `server` directory.

```env
PORT=3000

MONGODB_ATLAS_URI=your_mongodb_atlas_connection_string

GEMINI_API_KEY=your_google_gemini_api_key

GEMINI_MODEL=your_supported_gemini_model
```

Replace the placeholder values with your actual credentials and supported model configuration.

Start the backend:

```bash
pnpm dev
```

### 3. Frontend Setup

Open another terminal:

```bash
cd client
```

Install dependencies:

```bash
pnpm install
```

Start the frontend development server:

```bash
pnpm dev
```

Frontend URL:

```text
http://localhost:5173
```

Backend URL:

```text
http://localhost:3000
```

---

## 📥 Knowledge Base Ingestion

The project includes an ingestion script that collects and processes website information and stores the generated embeddings in MongoDB Atlas.

Run the following command from the `server` directory:

```bash
pnpm ingest
```

To preview the extracted website content without saving changes:

```bash
pnpm ingest -- --dry-run
```

### Custom Course Curriculum Ingestion

Custom course curriculum documents are maintained as Markdown (`.md`) files.

These files are processed separately as a knowledge source and their content is converted into embeddings for semantic retrieval.

The processed content is stored in MongoDB Atlas and can be retrieved when users ask course-related questions.

**Important:** The custom curriculum Markdown (`.md`) source files are maintained locally and are not included in the Git repository. Their processed content and embeddings are stored in MongoDB Atlas.

---

## 🔌 API Endpoints

Base URL:

```text
http://localhost:3000/api/chat
```

| Method | Endpoint | Description |
|---|---|---|
| POST | `/send-message` | Send a message to the AI chatbot |
| GET | `/conversations` | Retrieve conversations |
| GET | `/conversations/:id/messages` | Retrieve messages from a conversation |
| DELETE | `/conversations/:id` | Delete a conversation |

---

## 🔑 Required API Credentials

### Google Gemini API

Used for:
- Generating text embeddings.
- Generating AI responses.

Get your API key:

https://aistudio.google.com/apikey

### MongoDB Atlas

Used for:
- Storing website content.
- Storing course curriculum content.
- Storing embedding vectors.
- Performing vector similarity searches.
- Managing conversation data.

MongoDB Atlas:

https://www.mongodb.com/products/platform/atlas-database

---

## 🎯 Learning Objectives

This project provides practical exposure to modern AI application development.

After exploring the implementation, you should understand:

- How embeddings represent text mathematically.
- How embedding models convert text into vectors.
- Why text chunking is important in RAG.
- How to process website and Markdown content.
- How vector databases store embeddings.
- How MongoDB Atlas Vector Search works.
- How semantic search retrieves relevant information.
- How RAG connects external knowledge with LLMs.
- How to integrate Gemini APIs with a MERN application.
- How to build a multi-source AI knowledge assistant.
- How to maintain and update a RAG knowledge base.

---

## 🚀 Future Improvements

- Streaming AI responses.
- PDF and document-based knowledge ingestion.
- Support for additional knowledge sources.
- Hybrid search (keyword + vector search).
- Reranking retrieved documents.
- Advanced RAG evaluation.
- Improved conversation memory.
- AI agent integration.
- MCP (Model Context Protocol) integration.
- Improved authentication and user management.

---

## 👨‍💻 Author

**Sajeev T.**

MERN Stack Developer | AI Enthusiast

GitHub: https://github.com/sajeevsjv

---

⭐ If you find this project interesting, consider giving the repository a star!
