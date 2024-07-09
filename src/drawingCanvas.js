import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DrawingCanvas = () => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [ctx, setCtx] = useState(null);
    const [color, setColor] = useState(1); // Initial color (0-255 grayscale)
    const [currentPrediction, setCurrentPrediction] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showFeedbackButtons, setShowFeedbackButtons] = useState(false);
    const [predictions, setPredictions] = useState({});
    const [correctPredictions, setCorrectPredictions] = useState({});
    const [incorrectPredictions, setIncorrectPredictions] = useState({});
    const [totalCorrect, setTotalCorrect] = useState(0);
    const [totalIncorrect, setTotalIncorrect] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = 280; // Set canvas width
        canvas.height = 280; // Set canvas height
        const context = canvas.getContext('2d');
        context.fillStyle = `rgb(${color}, ${color}, ${color})`;
        context.lineJoin = 'round';
        context.lineCap = 'round';
        setCtx(context);
    }, [color]);

    const fetchPrediction = async () => {
        setIsLoading(true);
        const pixelData = getCanvasData();
        console.log(pixelData);
        try {
            const link = "http://localhost:8000/predict";
            const response = await axios.post(link, {data: pixelData}, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log(response.data);
            const prediction = response.data.data.prediction;
            console.log(prediction);
            setCurrentPrediction(prediction);
            console.log("current prediction: ", prediction);
            setShowFeedbackButtons(true);
        } catch (error) {
            console.error('There was an error submitting the data!', error);
            console.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

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
        ctx.lineWidth = 10;
        ctx.stroke();
    };

    const handleResetClick = (event) => {
        ctx.clearRect(0, 0, 280, 280);
        setCurrentPrediction(null);
        setShowFeedbackButtons(false);
    };

    const getCanvasData = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 28;
        tempCanvas.height = 28;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.drawImage(canvasRef.current, 0, 0, 280, 280, 0, 0, 28, 28);
        
        const imageData = tempCtx.getImageData(0, 0, 28, 28).data;
        
        const twoDArray = [];
        
        for (let y = 0; y < 28; y++) {
            const row = [];
            for (let x = 0; x < 28; x++) {
                const index = (y * 28 + x) * 4;
                const alphaValue = imageData[index + 3] > 0 ? 255 : 0;
                row.push(alphaValue);
            }
            twoDArray.push(row);
        }
        
        return twoDArray;
    };

    const handleSubmit = (event) => {
        fetchPrediction();
    };

    const handleFeedback = (isCorrect) => {
        setShowFeedbackButtons(false);
        if (currentPrediction !== null) {
            if (isCorrect) {
                setTotalCorrect(prev => prev + 1);
                setCorrectPredictions(prev => ({
                    ...prev,
                    [currentPrediction]: (prev[currentPrediction] || 0) + 1
                }));
            } else {
                setTotalIncorrect(prev => prev + 1);
                setIncorrectPredictions(prev => ({
                    ...prev,
                    [currentPrediction]: (prev[currentPrediction] || 0) + 1
                }));
            }
            setPredictions(prev => ({
                ...prev,
                [currentPrediction]: (prev[currentPrediction] || 0) + 1
            }));
        }
    };

    const yesNoChartData = {
        labels: ['Correct', 'Incorrect'],
        datasets: [
            {
                data: [totalCorrect, totalIncorrect],
                backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
            },
        ],
    };

    const predictionChartData = {
        labels: Array.from({ length: 10 }, (_, i) => i.toString()),
        datasets: [
            {
                label: 'Correct',
                data: Array.from({ length: 10 }, (_, i) => correctPredictions[i] || 0),
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
            {
                label: 'Incorrect',
                data: Array.from({ length: 10 }, (_, i) => incorrectPredictions[i] || 0),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
        ],
    };

    const chartOptions = {
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                },
            },
        },
        plugins: {
            legend: {
                display: true,
            },
        },
    };

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
                {showFeedbackButtons && (
                    <div className="feedback-buttons">
                        <p>Was this prediction correct?</p>
                        <button onClick={() => handleFeedback(true)}>Yes</button>
                        <button onClick={() => handleFeedback(false)}>No</button>
                    </div>
                )}
            </div>
            <div className="charts-container">
                <div className="chart">
                    <h3>Correct vs Incorrect Predictions</h3>
                    <Bar data={yesNoChartData} options={chartOptions} />
                </div>
                <div className="chart">
                    <h3>Predictions by Number</h3>
                    <Bar data={predictionChartData} options={chartOptions} />
                </div>
            </div>
        </div>
    );
};

export default DrawingCanvas;