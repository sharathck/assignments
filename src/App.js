import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import './App.css';

const mathOperators = ['+', '-', '×', '÷'];

const generateNumber = (digits) => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateProblem = (digitsOfFirstNumber, digitsOfSecondNumber, operator) => {
  const num1 = generateNumber(digitsOfFirstNumber);
  const num2 = generateNumber(digitsOfSecondNumber);
  return { num1, num2, operator };
};

const generateProblems = (digitsOfFirstNumber, digitsOfSecondNumber, operator) => {
  return Array(60).fill(null).map(() => generateProblem(digitsOfFirstNumber, digitsOfSecondNumber, operator));
};

const calculateAnswer = (num1, num2, operator) => {
  switch (operator) {
    case '+':
      return num1 + num2;
    case '-':
      return num1 - num2;
    case '×':
      return num1 * num2;
    case '÷':
      return num1 / num2;
    default:
      return null;
  }
};

function App() {
  const [problems, setProblems] = useState(generateProblems(3, 3, '-'));
  const [digitsOfFirstNumber, setDigitsOfFirstNumber] = useState(3);
  const [digitsOfSecondNumber, setDigitsOfSecondNumber] = useState(3);
  const [selectedOperator, setSelectedOperator] = useState('-');
  const [answers, setAnswers] = useState(Array(60).fill(''));
  const [correctness, setCorrectness] = useState(Array(60).fill(true));

  const handleRefresh = () => {
    setProblems(generateProblems(digitsOfFirstNumber, digitsOfSecondNumber, selectedOperator));
    setAnswers(Array(60).fill(''));
    setCorrectness(Array(60).fill(true));
  };

  const handleCheckAnswers = () => {
    const newCorrectness = problems.map((problem, index) => {
      const correctAnswer = calculateAnswer(problem.num1, problem.num2, problem.operator);
      return parseFloat(answers[index]) === correctAnswer;
    });
    setCorrectness(newCorrectness);
  };

  useEffect(() => {
    handleRefresh();
  }, [digitsOfFirstNumber, digitsOfSecondNumber, selectedOperator]);

  return (
    <div className="app-container">
      <div className="app-content">
        <div className="controls">
          <button 
            onClick={handleRefresh}
            className="refresh-button"
          >
            <RefreshCw size={20} />
          </button>
          <div>
            <label className="label">First Num Digits</label>
            <select 
              value={digitsOfFirstNumber} 
              onChange={(e) => setDigitsOfFirstNumber(Number(e.target.value))}
              className="select"
            >
              {[1, 2, 3, 4, 5].map(digit => (
                <option key={digit} value={digit}>{digit}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Second Num Digits</label>
            <select 
              value={digitsOfSecondNumber} 
              onChange={(e) => setDigitsOfSecondNumber(Number(e.target.value))}
              className="select"
            >
              {[1, 2, 3, 4, 5].map(digit => (
                <option key={digit} value={digit}>{digit}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Operation</label>
            <select 
              value={selectedOperator} 
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="select"
            >
              {mathOperators.map(operator => (
                <option key={operator} value={operator}>{operator}</option>
              ))}
            </select>
            <button 
            onClick={handleCheckAnswers}
            className="check-button"
          >
            Check Answers
          </button>
          </div>
        </div>
        <div className="problems-grid">
          {problems.map((problem, index) => (
            <div key={index} className="problem-card">
              <div className="problem-content">
                <div className="problem-number">{problem.num1}</div>
                <div className="problem-operation">
                  <span className="operator">{problem.operator}</span>
                  <span>{problem.num2}</span>
                </div>
                <div className="problem-divider"></div>
                <input 
                  type="text" 
                  value={answers[index]}
                  onChange={(e) => {
                    const newAnswers = [...answers];
                    newAnswers[index] = e.target.value;
                    setAnswers(newAnswers);
                  }}
                  className={`answer-input ${correctness[index] ? 'correct' : 'incorrect'}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;