# MFLB Kredit-Portal Prototype

Dies ist ein Prototyp für ein Kreditantrags-Portal mit Angular-Frontend und FastAPI-Backend.

## Projekt-Struktur

- `backend/`: Python FastAPI-Backend mit SQLAlchemy-Datenbank.
- `frontend/`: Angular (v19+) Frontend.

---

## Backend starten

Das Backend verwendet ein Python Virtual Environment (`venv`).

### 1. Venv initialisieren und aktivieren (einmalig)

Navigiere in den Backend-Ordner:
```bash
cd backend
```

Erstelle das venv (falls nicht vorhanden):
```bash
python3 -m venv venv
oder
python -m venv venv
```

Aktiviere das venv:
```bash
# Linux / macOS
source venv/bin/activate

# Windows (Command Prompt)
# venv\Scripts\activate

# Windows (PowerShell)
# .\venv\Scripts\Activate.ps1
```

### 2. Abhängigkeiten installieren

Stelle sicher, dass das venv aktiviert ist, und installiere die Requirements:
```bash
pip install -r requirements.txt
```

### 3. Datenbank initialisieren (Optional)

Um die Datenbank mit Testdaten zu füllen:
```bash
python components/core/seed.py
```

### 4. API-Server starten

```bash
python main.py
```
Die API läuft standardmäßig unter `http://localhost:8000`.

---

## Frontend starten

### 1. Abhängigkeiten installieren

Navigiere in den Frontend-Ordner:
```bash
cd frontend
```

Installiere die npm-Pakete:
```bash
npm install
```

### 2. Angular Development Server starten

```bash
npm start
```
Das Portal ist dann unter `http://localhost:4200` erreichbar.

---

## Features (Auswahl)

- **Kundenportal**: Antrag ausfüllen, Live-Validierung, Status-Timeline und digitale Signatur per Maus/Touch.
- **Sachbearbeiter-Ansicht**: Workflow-Steuerung (Scoring, Zinsberechnung, Dokumentenerstellung).
- **Backend-Komponenten**: Modularer Aufbau unter `backend/components/` (Core, Application, Login, Interest).
