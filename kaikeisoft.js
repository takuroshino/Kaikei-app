class KaikeiApp {
    constructor() {
        this.preview = document.getElementById('preview');
        this.initializeEventListeners();
        this.loadTransactions();
    }

    initializeEventListeners() {
        document.getElementById('cameraButton').onclick = () => this.captureReceipt();
        document.getElementById('transactionForm').onsubmit = (e) => this.handleSubmit(e);
    }

    async captureReceipt() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = 'environment';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        this.preview.src = event.target.result;
                        this.preview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            };
            
            input.click();
        } catch (error) {
            console.error('カメラの起動に失敗しました:', error);
            alert('カメラの起動に失敗しました。');
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        const transaction = {
            date: document.getElementById('date').value,
            type: document.getElementById('type').value,
            category: document.getElementById('category').value,
            amount: document.getElementById('amount').value,
            description: document.getElementById('description').value
        };
        this.saveTransaction(transaction);
        this.updateDisplay();
        e.target.reset();
    }

    saveTransaction(transaction) {
        let transactions = this.getTransactions();
        transactions.push(transaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    getTransactions() {
        const transactions = localStorage.getItem('transactions');
        return transactions ? JSON.parse(transactions) : [];
    }

    loadTransactions() {
        this.updateDisplay();
    }

    updateDisplay() {
        const transactions = this.getTransactions();
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += parseInt(t.amount);
            } else {
                totalExpense += parseInt(t.amount);
            }
        });

        document.getElementById('totalSales').textContent = `¥${totalIncome.toLocaleString()}`;
        document.getElementById('totalExpenses').textContent = `¥${totalExpense.toLocaleString()}`;
        document.getElementById('totalProfit').textContent = `¥${(totalIncome - totalExpense).toLocaleString()}`;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new KaikeiApp();
}); 