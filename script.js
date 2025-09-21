class Calculator {
    constructor() {
        this.currentInput = '';
        this.operation = null;
        this.previousInput = '';
        this.shouldResetScreen = false;
        this.history = JSON.parse(localStorage.getItem('calculator-history')) || [];
        this.isScientificMode = false;
        this.isDarkMode = localStorage.getItem('calculator-theme') === 'dark';

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateDisplay();
        this.updateHistoryPanel();
        this.applyTheme();
    }

    bindEvents() {
        // Number buttons
        document.querySelectorAll('[data-number]').forEach(button => {
            button.addEventListener('click', (e) => {
                this.inputNumber(e.target.dataset.number);
            });
        });

        // Operation buttons
        document.querySelectorAll('[data-operation]').forEach(button => {
            button.addEventListener('click', (e) => {
                this.inputOperation(e.target.dataset.operation);
            });
        });

        // Action buttons
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleAction(e.target.dataset.action);
            });
        });

        // Function buttons
        document.querySelectorAll('[data-function]').forEach(button => {
            button.addEventListener('click', (e) => {
                this.inputFunction(e.target.dataset.function);
            });
        });

        // Value buttons (π, e)
        document.querySelectorAll('[data-value]').forEach(button => {
            button.addEventListener('click', (e) => {
                this.inputNumber(e.target.dataset.value);
            });
        });

        // Control buttons
        document.getElementById('scientificToggle').addEventListener('click', () => {
            this.toggleScientific();
        });

        document.getElementById('clearAll').addEventListener('click', () => {
            this.clearAll();
        });

        document.getElementById('backspace').addEventListener('click', () => {
            this.backspace();
        });

        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        document.getElementById('historyToggle').addEventListener('click', () => {
            this.showHistory();
        });

        document.getElementById('closeHistory').addEventListener('click', () => {
            this.hideHistory();
        });

        document.getElementById('clearHistory').addEventListener('click', () => {
            this.clearHistory();
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        // Auto-save history
        window.addEventListener('beforeunload', () => {
            this.saveHistory();
        });
    }

    inputNumber(number) {
        if (this.shouldResetScreen) {
            this.currentInput = '';
            this.shouldResetScreen = false;
        }

        if (number === '0' && this.currentInput === '0') return;

        if (this.currentInput === '0') {
            this.currentInput = number;
        } else {
            this.currentInput += number;
        }

        this.updateDisplay();
    }

    inputOperation(operation) {
        if (this.currentInput === '') return;

        if (this.previousInput !== '' && !this.shouldResetScreen) {
            this.calculate();
        }

        this.operation = operation;
        this.previousInput = this.currentInput;
        this.shouldResetScreen = true;

        this.updateDisplay();
    }

    inputFunction(func) {
        if (this.currentInput === '') this.currentInput = '0';

        const num = parseFloat(this.currentInput);
        let result;

        try {
            switch (func) {
                case 'sin':
                    result = Math.sin(this.toRadians(num));
                    break;
                case 'cos':
                    result = Math.cos(this.toRadians(num));
                    break;
                case 'tan':
                    result = Math.tan(this.toRadians(num));
                    break;
                case 'log':
                    result = Math.log10(num);
                    break;
                case 'ln':
                    result = Math.log(num);
                    break;
                case 'sqrt':
                    result = Math.sqrt(num);
                    break;
                case 'pow':
                    result = Math.pow(num, 2);
                    break;
                case 'factorial':
                    result = this.factorial(num);
                    break;
                default:
                    return;
            }

            if (isNaN(result) || !isFinite(result)) {
                throw new Error('Invalid calculation');
            }

            const calculation = `${func}(${num})`;
            this.addToHistory(calculation, result);

            this.currentInput = result.toString();
            this.shouldResetScreen = true;
            this.updateDisplay();

        } catch (error) {
            this.showError('Error');
        }
    }

    handleAction(action) {
        switch (action) {
            case 'clear':
                this.clear();
                break;
            case 'equals':
                this.calculate();
                break;
            case 'decimal':
                this.inputDecimal();
                break;
        }
    }

    inputDecimal() {
        if (this.shouldResetScreen) {
            this.currentInput = '0';
            this.shouldResetScreen = false;
        }

        if (this.currentInput.includes('.')) return;

        if (this.currentInput === '') {
            this.currentInput = '0';
        }

        this.currentInput += '.';
        this.updateDisplay();
    }

    calculate() {
        if (this.operation === null || this.shouldResetScreen) return;
        if (this.previousInput === '' || this.currentInput === '') return;

        const prev = parseFloat(this.previousInput);
        const current = parseFloat(this.currentInput);
        let result;

        try {
            switch (this.operation) {
                case '+':
                    result = prev + current;
                    break;
                case '-':
                    result = prev - current;
                    break;
                case '*':
                    result = prev * current;
                    break;
                case '/':
                    if (current === 0) throw new Error('Division by zero');
                    result = prev / current;
                    break;
                case '^':
                    result = Math.pow(prev, current);
                    break;
                case '%':
                    result = prev % current;
                    break;
                case '+/-':
                    result = -current;
                    break;
                default:
                    return;
            }

            if (isNaN(result) || !isFinite(result)) {
                throw new Error('Invalid calculation');
            }

            const calculation = `${prev} ${this.operation} ${current}`;
            this.addToHistory(calculation, result);

            this.currentInput = result.toString();
            this.operation = null;
            this.previousInput = '';
            this.shouldResetScreen = true;
            this.updateDisplay();

        } catch (error) {
            this.showError('Error');
        }
    }

    clear() {
        this.currentInput = '';
        this.updateDisplay();
    }

    clearAll() {
        this.currentInput = '';
        this.previousInput = '';
        this.operation = null;
        this.shouldResetScreen = false;
        this.updateDisplay();
    }

    backspace() {
        if (this.currentInput.length > 1) {
            this.currentInput = this.currentInput.slice(0, -1);
        } else {
            this.currentInput = '';
        }
        this.updateDisplay();
    }

    toggleScientific() {
        this.isScientificMode = !this.isScientificMode;
        const scientificButtons = document.getElementById('scientificButtons');
        const toggle = document.getElementById('scientificToggle');

        if (this.isScientificMode) {
            scientificButtons.classList.add('show');
            toggle.classList.add('active');
            toggle.textContent = 'Basic';
        } else {
            scientificButtons.classList.remove('show');
            toggle.classList.remove('active');
            toggle.textContent = 'Scientific';
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme();
        localStorage.setItem('calculator-theme', this.isDarkMode ? 'dark' : 'light');
    }

    applyTheme() {
        const body = document.body;
        const themeToggle = document.getElementById('themeToggle');

        if (this.isDarkMode) {
            body.setAttribute('data-theme', 'dark');
            themeToggle.textContent = '☀️';
        } else {
            body.setAttribute('data-theme', 'light');
            themeToggle.textContent = '🌙';
        }
    }

    showHistory() {
        document.getElementById('historyPanel').classList.add('show');
    }

    hideHistory() {
        document.getElementById('historyPanel').classList.remove('show');
    }

    addToHistory(calculation, result) {
        const historyItem = {
            calculation,
            result: this.formatNumber(result),
            timestamp: new Date().toLocaleString()
        };

        this.history.unshift(historyItem);

        // Keep only last 50 calculations
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }

        this.updateHistoryPanel();
        this.saveHistory();
    }

    updateHistoryPanel() {
        const content = document.getElementById('historyContent');

        if (this.history.length === 0) {
            content.innerHTML = `
                        <div class="empty-history">
                            <div class="empty-history-icon">🧮</div>
                            <p>No calculations yet</p>
                            <p style="font-size: 0.9rem; margin-top: 5px;">Your calculation history will appear here</p>
                        </div>
                    `;
            return;
        }

        content.innerHTML = this.history.map((item, index) => `
                    <div class="history-item" onclick="calculator.useHistoryResult('${item.result}')">
                        <div class="history-calculation">${item.calculation}</div>
                        <div class="history-result">${item.result}</div>
                    </div>
                `).join('');
    }

    useHistoryResult(result) {
        this.currentInput = result.replace(/,/g, '');
        this.shouldResetScreen = true;
        this.updateDisplay();
        this.hideHistory();
    }

    clearHistory() {
        if (confirm('Clear all calculation history?')) {
            this.history = [];
            this.updateHistoryPanel();
            this.saveHistory();
        }
    }

    saveHistory() {
        localStorage.setItem('calculator-history', JSON.stringify(this.history));
    }

    updateDisplay() {
        const calculationElement = document.getElementById('calculation');
        const resultElement = document.getElementById('result');

        let calculation = '';
        if (this.previousInput) {
            calculation = `${this.previousInput} ${this.operation || ''}`;
        }

        calculationElement.textContent = calculation;
        resultElement.textContent = this.formatNumber(this.currentInput || '0');
    }

    formatNumber(number) {
        if (number === '' || number === null || number === undefined) return '0';

        const num = parseFloat(number);
        if (isNaN(num)) return '0';

        // Handle very large or very small numbers
        if (Math.abs(num) > 1e15 || (Math.abs(num) < 1e-6 && num !== 0)) {
            return num.toExponential(6);
        }

        // Format with commas for large numbers
        if (Math.abs(num) >= 1000) {
            return num.toLocaleString('en-US', { maximumFractionDigits: 8 });
        }

        return num.toString();
    }

    showError(message) {
        document.getElementById('result').textContent = message;
        setTimeout(() => {
            this.clearAll();
        }, 2000);
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    factorial(n) {
        if (n < 0 || n !== Math.floor(n)) throw new Error('Invalid input');
        if (n === 0 || n === 1) return 1;
        if (n > 170) throw new Error('Number too large');

        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    handleKeyboard(e) {
        e.preventDefault();

        if (e.key >= '0' && e.key <= '9') {
            this.inputNumber(e.key);
        } else if (e.key === '.') {
            this.inputDecimal();
        } else if (e.key === '+') {
            this.inputOperation('+');
        } else if (e.key === '-') {
            this.inputOperation('-');
        } else if (e.key === '*') {
            this.inputOperation('*');
        } else if (e.key === '/') {
            this.inputOperation('/');
        } else if (e.key === '%') {
            this.inputOperation('%');
        } else if (e.key === 'Enter' || e.key === '=') {
            this.calculate();
        } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
            this.clearAll();
        } else if (e.key === 'Backspace') {
            this.backspace();
        } else if (e.key === 's' || e.key === 'S') {
            this.toggleScientific();
        } else if (e.key === 't' || e.key === 'T') {
            this.toggleTheme();
        } else if (e.key === 'h' || e.key === 'H') {
            document.getElementById('historyPanel').classList.contains('show')
                ? this.hideHistory()
                : this.showHistory();
        }
    }
}

// Initialize calculator
const calculator = new Calculator();

// Add some visual feedback animations
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function () {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = '';
        }, 150);
    });
});

// Keyboard shortcuts tooltip (optional)
let shortcutTooltip = null;
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        if (shortcutTooltip) {
            shortcutTooltip.remove();
            shortcutTooltip = null;
            return;
        }

        shortcutTooltip = document.createElement('div');
        shortcutTooltip.innerHTML = `
                    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                                background: var(--bg-secondary); padding: 20px; border-radius: 15px; 
                                box-shadow: var(--shadow-heavy); z-index: 2000; color: var(--text-primary);
                                border: 1px solid var(--border-color);">
                        <h3 style="margin-bottom: 15px;">⌨️ Keyboard Shortcuts</h3>
                        <div style="display: grid; grid-template-columns: auto auto; gap: 10px; font-size: 0.9rem;">
                            <span>Numbers & Operators:</span><span>0-9, +, -, *, /, %</span>
                            <span>Calculate:</span><span>Enter or =</span>
                            <span>Clear All:</span><span>Escape or C</span>
                            <span>Backspace:</span><span>Backspace</span>
                            <span>Scientific Mode:</span><span>S</span>
                            <span>Theme Toggle:</span><span>T</span>
                            <span>History:</span><span>H</span>
                            <span>Close This:</span><span>Ctrl + /</span>
                        </div>
                    </div>
                `;
        document.body.appendChild(shortcutTooltip);

        setTimeout(() => {
            if (shortcutTooltip) {
                shortcutTooltip.remove();
                shortcutTooltip = null;
            }
        }, 5000);
    }
});