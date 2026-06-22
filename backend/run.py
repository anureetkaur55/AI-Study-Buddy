import uvicorn

if __name__ == "__main__":
    # Launch the FastAPI app with live-reloading enabled
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
