import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';

const DrawingCanvas = () => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [ctx, setCtx] = useState(null);
    const [color, setColor] = useState(1); // Initial color (0-255 grayscale)
    const [currentPrediction, setCurrentPrediction] = useState(null)
    const [isLoading, setIsLoading] = useState(false);


    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = 280; // Set canvas width
        canvas.height = 280; // Set canvas height
        const context = canvas.getContext('2d');
        context.fillStyle = `rgb(${color}, ${color}, ${color})`;
        setCtx(context);
    }, [color]);


    const fetchPrediction = async () => {
        setIsLoading(true);
        const pixelData = getCanvasData()
        console.log(pixelData);
        try {
            // const link = "https://a4c1-2604-3d08-d182-ea00-a40e-f9b6-f268-fcc6.ngrok-free.app/predict"
            const link = "http://localhost:8000/predict"
            const response = await axios.post(link, {data: pixelData}, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log(response.data);
            const prediction = response.data.data.prediction
            console.log(prediction)
            setCurrentPrediction(prediction)
            console.log("current prediction: ", prediction)
            
        } catch (error) {
          console.error('There was an error submitting the data!', error);
          console.error(error.message);
        } finally {
            setIsLoading(false);
        }
      }

    const startDrawing = ({ nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;
            ctx.beginPath();
            ctx.moveTo(offsetX, offsetY);
            setIsDrawing(true);
        };

    const finishDrawing = () => {
        ctx.closePath();
        setIsDrawing(false);
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = nativeEvent;
        ctx.lineTo(offsetX, offsetY);
        ctx.lineWidth = 10
        ctx.stroke();
    };

    const handleResetClick = (event) => {
        ctx.clearRect(0, 0, 280, 280);
    }

    const getCanvasData = () => {
        // Create a temporary canvas to scale down the drawing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 28;
        tempCanvas.height = 28;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw the original 280x280 canvas onto the 28x28 canvas
        tempCtx.drawImage(canvasRef.current, 0, 0, 280, 280, 0, 0, 28, 28);
        
        // Get the image data from the 28x28 canvas
        const imageData = tempCtx.getImageData(0, 0, 28, 28).data;
        
        // Create a 2D array to hold the binary pixel data
        const twoDArray = [];
        
        for (let y = 0; y < 28; y++) {
            const row = [];
            for (let x = 0; x < 28; x++) {
                const index = (y * 28 + x) * 4;
                // const alphaValue = imageData[index + 3] / 255; // Check the alpha value to determine if the pixel is filled
                const alphaValue = imageData[index + 3] > 0 ? 255 : 0 // Check the alpha value to determine if the pixel is filled
                row.push(alphaValue)
                // row.push(alphaValue > 0 ? 1 : 0); // If pixel is not empty (alpha > 0), set to 1, otherwise set to 0
            }
            twoDArray.push(row);
        }
        
        return twoDArray;
    };

    const handleSubmit = (event) => {
        fetchPrediction()
    }

    return (
        <div className="drawing-canvas-container">
            <h2>Handwritten Digit Recognition</h2>
            <div className="canvas-wrapper">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseUp={finishDrawing}
                    onMouseMove={draw}
                    onMouseLeave={finishDrawing}
                    className="drawing-canvas"
                />
            </div>
            <div className="button-container">
                <button className="action-button reset" onClick={handleResetClick}>Reset</button>
                <button className="action-button submit" onClick={handleSubmit}>Submit</button>
            </div>
            <div className="prediction-result">
                {isLoading ? (
                    <div className="loading">Predicting...</div>
                ) : (
                    <p>
                        {currentPrediction !== null 
                            ? `The predicted number is: `
                            : `Draw a number and click submit to get a prediction.`}
                        <span className="prediction">
                            {currentPrediction !== null ? currentPrediction : ''}
                        </span>
                    </p>
                )}
            </div>
        </div>
        );
    };

    export default DrawingCanvas;
