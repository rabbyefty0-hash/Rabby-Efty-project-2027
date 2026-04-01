import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import * as math from 'mathjs';

interface CalculatorProps {
  onBack: () => void;
}

export function Calculator({ onBack }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isNewNumber, setIsNewNumber] = useState(true);
  const [isScientific, setIsScientific] = useState(false);

  const handleInput = (val: string) => {
    if (isNewNumber) {
      setDisplay(val);
      setIsNewNumber(false);
    } else {
      setDisplay(display === '0' ? val : display + val);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(equation + display + op);
    setIsNewNumber(true);
  };

  const calculate = () => {
    try {
      const fullEquation = equation + display;
      const result = math.evaluate(fullEquation);
      
      // Format result to avoid long decimals
      const formattedResult = math.format(result, { precision: 10 });
      
      setDisplay(String(formattedResult));
      setEquation('');
      setIsNewNumber(true);
    } catch (e) {
      setDisplay('Error');
      setEquation('');
      setIsNewNumber(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
    setIsNewNumber(true);
  };

  const deleteLast = () => {
    if (isNewNumber) return;
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
  };

  const basicButtons = [
    ['C', '⌫', '%', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['Sci', '0', '.', '=']
  ];

  const scientificButtons = [
    ['sin(', 'cos(', 'tan(', 'pi'],
    ['asin(', 'acos(', 'atan(', 'e'],
    ['log(', 'ln(', 'sqrt(', '^'],
    ['(', ')', '!', 'deg']
  ];

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <div className="flex items-center p-4 pt-12 bg-zinc-900">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold ml-2">Calculator</h1>
      </div>

      <div className="flex-1 flex flex-col justify-end p-6">
        <div className="text-right text-gray-400 text-2xl h-8 mb-2 truncate">{equation}</div>
        <div className="text-right text-6xl font-light mb-8 truncate">{display}</div>

        {isScientific && (
          <div className="grid grid-cols-4 gap-3 mb-3">
            {scientificButtons.flat().map((btn, i) => (
              <motion.button
                key={`sci-${i}`}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (btn === 'pi') handleInput('pi');
                  else if (btn === 'e') handleInput('e');
                  else if (btn === 'deg') handleInput(' deg');
                  else handleInput(btn);
                }}
                className="h-12 rounded-full text-lg flex items-center justify-center bg-zinc-800 text-white"
              >
                {btn.replace('(', '')}
              </motion.button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          {basicButtons.flat().map((btn, i) => (
            <motion.button
              key={`basic-${i}`}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (btn === 'C') clear();
                else if (btn === '⌫') deleteLast();
                else if (btn === '=') calculate();
                else if (['+', '-', '*', '/', '%', '^'].includes(btn)) handleOperator(btn);
                else if (btn === 'Sci') setIsScientific(!isScientific);
                else handleInput(btn);
              }}
              className={`h-16 rounded-full text-2xl flex items-center justify-center
                ${['/', '*', '-', '+', '='].includes(btn) ? 'bg-orange-500 text-white' : 
                  ['C', '⌫', '%', 'Sci'].includes(btn) ? 'bg-gray-300 text-black' : 'bg-zinc-800 text-white'}
              `}
            >
              {btn}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
