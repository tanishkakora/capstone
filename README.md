# ♻️ SmartWaste AI

**SmartWaste AI** is a multi-agent intelligent waste management platform built for smart cities. It enables citizens to report waste issues while AI agents classify waste, prioritize complaints, optimize collection routes, and provide analytics for municipal authorities.

Developed as a **Google Kaggle AI Agents Capstone Project** using **Google ADK**, **MCP**, and **Gemini AI**.

---

## ✨ Features

- 🤖 Multi-Agent AI System
- 🗑️ AI Waste Classification
- 📍 Interactive Map with Location Pinning
- 🚛 Smart Route Optimization
- 📊 Municipal Analytics Dashboard
- ♻️ AI Recycling Assistant
- 🔐 JWT Authentication & Role-Based Access
- 📱 Responsive React UI

---

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Vite
- CSS
- Leaflet Maps

### Backend
- FastAPI
- Python
- SQLAlchemy
- SQLite

### AI
- Google Gemini
- Google Agent Development Kit (ADK)
- Model Context Protocol (MCP)

---

## 🏗️ Project Structure

```
capstone/
├── frontend/
├── backend/
├── README.md
```

---

## 🚀 Installation

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🤖 AI Agent Workflow

Citizen Report

⬇️

Complaint Intake Agent

⬇️

Waste Classification Agent

⬇️

Priority Agent

⬇️

Route Optimization Agent

⬇️

Analytics Agent

⬇️

Municipal Dashboard

---


## 🎯 Future Improvements

- IoT Smart Bin Integration
- Live GPS Truck Tracking
- Predictive Overflow Detection
- Citizen Reward System
- Carbon Emission Analytics
