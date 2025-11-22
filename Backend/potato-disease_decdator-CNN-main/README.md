## Potato Disease Detector – Full Stack Application

This project includes a **FastAPI backend** that hosts the trained **TensorFlow ML model** along with a **React frontend** that captures live camera frames and requests predictions from the API.

## 🚀 Quick Start

### Option 1: Use Startup Scripts (Recommended)

1. **Test your setup:**
   ```powershell
   .\test-connection.ps1
   ```

2. **Start everything:**
   ```powershell
   .\start-all.ps1
   ```
   This opens two windows - one for backend, one for frontend.

   OR start them separately:
   ```powershell
   # Terminal 1 - Backend
   .\start-backend.ps1
   
   # Terminal 2 - Frontend  
   .\start-frontend.ps1
   ```

3. **Open your browser:** `http://localhost:3000`

### Option 2: Manual Setup

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed step-by-step instructions.

## 📋 Architecture

```
Frontend (React) → Backend (FastAPI) → ML Model (TensorFlow)
   Port 3000          Port 8000         potato_classifier_final.h5
```

**Data Flow:**
1. User captures image from webcam in React app
2. Frontend sends image to `http://localhost:8000/predict`
3. Backend preprocesses image and runs ML model inference
4. Backend returns prediction (label + confidence)
5. Frontend displays result to user

### Backend (FastAPI)

- Location: `backend/app/main.py`
- Configurable values:
  - `MODEL_PATH` – defaults to `potato_classifier_final.h5` in the repo root
  - `CLASS_NAMES` – matches the dataset folders (`Potato___Early_blight`, `Potato___Late_blight`, `Potato___healthy`)

#### Install & run

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Available endpoints:

- `GET /health` – basic readiness probe
- `POST /predict` – accepts multipart form-data with `file` (image). Returns `{"label": str, "confidence": float}`.

### Frontend (React)

- Location: `frontend/`
- Key component: `src/App.js`
  - Requests camera access.
  - Captures a frame to a hidden canvas.
  - Uploads the JPEG blob to `http://localhost:8000/predict`.
  - Shows model label + confidence.

#### Install & run

```powershell
cd frontend
npm install
npm start
```

Visit `http://localhost:3000`, allow camera access, and click **Capture & Predict**.

### Option B – Browser-only (TensorFlow.js)

If you prefer running inference entirely in the browser:

1. Convert your Keras model:
   ```powershell
   pip install tensorflowjs
   tensorflowjs_converter --input_format keras \
     potato_classifier_final.h5 \
     frontend/public/tfjs-model
   ```
2. In the React app, load the TF.js graph via `@tensorflow/tfjs` and call `tf.loadLayersModel("/tfjs-model/model.json")`.
3. Reuse the same canvas capture logic, but pass the pixel tensor to the TF.js model locally.

This avoids a backend, but increases client CPU usage and bundle size.

## 📚 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup and troubleshooting guide
- **API Documentation** - Available at `http://localhost:8000/docs` when backend is running

## 🔧 Troubleshooting

Run the connection test:
```powershell
.\test-connection.ps1
```

Common issues:
- **Model not found**: Ensure `potato_classifier_final.h5` is in the project root
- **Port conflicts**: Change ports in `backend/app/main.py` (line 19) and `frontend/src/App.js` (line 66)
- **CORS errors**: Backend is configured for `http://localhost:3000` (line 28 in `main.py`)

## 🚢 Next Steps

- Secure the API (auth, HTTPS) before exposing publicly
- Add image size validation & better error messages
- Containerize backend/frontend for deployment
- Configure reverse proxy for production

