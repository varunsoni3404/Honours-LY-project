from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ml_engine import FactGraphEngine
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML Engine Global Variable
engine = FactGraphEngine()

class TextRequest(BaseModel):
    text: str

@app.post("/analyze")
async def analyze_text(request: TextRequest):
    if not request.text:
        raise HTTPException(status_code=400, detail="Text is empty")
    
    try:
        result = engine.generate_summary_and_graph(request.text)
        return result
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)