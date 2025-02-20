class KaikeiApp {
    constructor() {
        this.preview = document.getElementById('preview');
        this.form = document.getElementById('transactionForm');
        this.tabs = document.querySelectorAll('.tab');
        this.init();
        // 保存されているデータを読み込む
        this.loadTransactions();
        
        // チャット機能の初期化
        this.chatMessages = [];
        this.initChat();
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.initFilters();
    }

    init() {
        // タブの初期化
        this.tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                this.tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.updateMode(index === 1);
            });
        });

        // カメラボタンの初期化
        document.getElementById('cameraButton').onclick = () => this.captureReceipt();
        
        // フォームの初期化
        this.form.onsubmit = (e) => this.handleSubmit(e);

        // 初期状態の設定
        this.tabs[0].classList.add('active');
        this.updateMode(false);
    }

    updateMode(isExpense) {
        // フォームの状態を更新
        this.form.classList.toggle('expense-mode', isExpense);
        
        // タイプを更新
        this.form.querySelector('#type').value = isExpense ? 'expense' : 'income';
        
        // カテゴリーを更新
        const select = this.form.querySelector('#category');
        select.querySelector('optgroup[label="売上（収入）"]').style.display = isExpense ? 'none' : '';
        select.querySelector('optgroup[label="経費（支出）"]').style.display = isExpense ? '' : 'none';
        select.value = isExpense ? 'supplies' : 'sales';
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
        
        const form = e.target;

        // フォームの各要素の値を確認
        console.log('フォームの値を確認:');
        console.log('日付:', form.querySelector('#date').value);
        console.log('タイプ:', form.querySelector('#type').value);
        console.log('カテゴリー:', form.querySelector('#category').value);
        console.log('金額:', form.querySelector('#amount').value);
        console.log('説明:', form.querySelector('#description').value);
        
        const transaction = {
            date: form.querySelector('#date').value,
            type: form.querySelector('#type').value,
            category: form.querySelector('#category').value,
            amount: Number(form.querySelector('#amount').value),
            description: form.querySelector('#description').value,
            timestamp: new Date().getTime()
        };

        // 作成されたtransactionオブジェクトを確認
        console.log('作成されたデータ:', transaction);

        if (!transaction.date || !transaction.amount || !transaction.category) {
            console.log('必須項目が不足しています');
            alert('必須項目を入力してください');
            return;
        }

        this.saveTransaction(transaction);

        // フォームをリセット
        form.reset();
        this.preview.style.display = 'none';
        this.preview.src = '';

        alert('記帳が完了しました');
    }

    saveTransaction(transaction) {
        let transactions = this.getTransactions();
        
        // デバッグ用のログを追加
        console.log('既存の取引データ:', transactions);
        
        transactions.push(transaction);
        
        // デバッグ用のログを追加
        console.log('保存する取引データ:', transactions);
        
        try {
            localStorage.setItem('transactions', JSON.stringify(transactions));
            // デバッグ用のログを追加
            console.log('データの保存が完了しました');
            
            // 保存後に表示を更新
            this.updateDisplay();
            this.updateTransactionList();
        } catch (error) {
            console.error('データの保存中にエラーが発生しました:', error);
            alert('データの保存に失敗しました');
        }
    }

    getTransactions() {
        const transactions = localStorage.getItem('transactions');
        return transactions ? JSON.parse(transactions) : [];
    }

    loadTransactions() {
        this.updateDisplay();
        this.updateTransactionList();
    }

    initFilters() {
        // フィルターの初期化
        const monthFilter = document.getElementById('monthFilter');
        const typeFilter = document.getElementById('typeFilter');
        const searchInput = document.getElementById('searchInput');
        const prevButton = document.getElementById('prevPage');
        const nextButton = document.getElementById('nextPage');

        // フィルター変更時のイベント
        monthFilter.addEventListener('change', () => this.updateTransactionList());
        typeFilter.addEventListener('change', () => this.updateTransactionList());
        searchInput.addEventListener('input', () => this.updateTransactionList());

        // ページネーション
        prevButton.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.updateTransactionList();
            }
        });

        nextButton.addEventListener('click', () => {
            const filteredTransactions = this.getFilteredTransactions();
            const maxPage = Math.ceil(filteredTransactions.length / this.itemsPerPage);
            if (this.currentPage < maxPage) {
                this.currentPage++;
                this.updateTransactionList();
            }
        });
    }

    getFilteredTransactions() {
        let transactions = this.getTransactions();
        const monthFilter = document.getElementById('monthFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        const searchText = document.getElementById('searchInput').value.toLowerCase();

        // 月次フィルター
        if (monthFilter === 'current') {
            const now = new Date();
            transactions = transactions.filter(t => {
                const date = new Date(t.date);
                return date.getMonth() === now.getMonth() && 
                       date.getFullYear() === now.getFullYear();
            });
        } else if (monthFilter === 'last') {
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
            transactions = transactions.filter(t => {
                const date = new Date(t.date);
                return date.getMonth() === lastMonth.getMonth() && 
                       date.getFullYear() === lastMonth.getFullYear();
            });
        }

        // 種類フィルター
        if (typeFilter) {
            transactions = transactions.filter(t => t.type === typeFilter);
        }

        // 検索フィルター
        if (searchText) {
            transactions = transactions.filter(t => 
                t.description.toLowerCase().includes(searchText) ||
                t.category.toLowerCase().includes(searchText)
            );
        }

        return transactions;
    }

    updateTransactionList() {
        const transactions = this.getFilteredTransactions();
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageTransactions = transactions.slice(startIndex, endIndex);

        const listHTML = pageTransactions.map(t => `
            <div class="transaction-item ${t.type}">
                <div class="receipt-icon">🧾</div>
                <div class="transaction-details">
                    <h3>${t.description || (t.type === 'income' ? '売上' : '経費')}</h3>
                    <div class="transaction-meta">
                        ${t.date} ・ ${t.category}
                    </div>
                </div>
                <div class="transaction-amount">
                    ${t.type === 'income' ? '+' : '-'}¥${t.amount.toLocaleString()}
                </div>
            </div>
        `).join('');

        const listContainer = document.querySelector('.transaction-items');
        listContainer.innerHTML = listHTML;

        // ページ情報の更新
        const maxPage = Math.ceil(transactions.length / this.itemsPerPage);
        document.getElementById('pageInfo').textContent = `${this.currentPage}/${maxPage}`;
    }

    updateDisplay() {
        const transactions = this.getTransactions();
        
        // デバッグ用のログを追加
        console.log('表示更新用の取引データ:', transactions);
        
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            const amount = Number(t.amount);
            if (t.type === 'income') {
                totalIncome += amount;
                console.log('収入を加算:', amount, '現在の合計:', totalIncome);
            } else {
                totalExpense += amount;
                console.log('支出を加算:', amount, '現在の合計:', totalExpense);
            }
        });

        // デバッグ用のログを追加
        console.log('最終計算結果 - 収入:', totalIncome, '支出:', totalExpense);

        // 金額の表示を更新
        const totalSalesElement = document.getElementById('totalSales');
        const totalExpensesElement = document.getElementById('totalExpenses');
        const totalProfitElement = document.getElementById('totalProfit');

        if (totalSalesElement && totalExpensesElement && totalProfitElement) {
            totalSalesElement.textContent = `¥${totalIncome.toLocaleString()}`;
            totalExpensesElement.textContent = `¥${totalExpense.toLocaleString()}`;
            totalProfitElement.textContent = `¥${(totalIncome - totalExpense).toLocaleString()}`;
        } else {
            console.error('表示要素が見つかりません');
        }
    }

    initChat() {
        const sendButton = document.getElementById('sendMessage');
        const chatInput = document.getElementById('chatInput');
        const chatMessages = document.getElementById('chatMessages');

        sendButton.addEventListener('click', () => {
            const message = chatInput.value.trim();
            if (message) {
                this.addChatMessage('user', message);
                chatInput.value = '';
                // ここにAIの応答を実装することができます
                this.addChatMessage('assistant', 'ご質問ありがとうございます。どのようにお手伝いできますか？');
            }
        });

        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendButton.click();
            }
        });
    }

    addChatMessage(type, content) {
        const message = {
            type,
            content,
            timestamp: new Date().getTime()
        };
        
        this.chatMessages.push(message);
        this.saveChatHistory();
        this.updateChatDisplay();
    }

    saveChatHistory() {
        localStorage.setItem('chatHistory', JSON.stringify(this.chatMessages));
    }

    loadChatHistory() {
        const history = localStorage.getItem('chatHistory');
        if (history) {
            this.chatMessages = JSON.parse(history);
            this.updateChatDisplay();
        }
    }

    updateChatDisplay() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = this.chatMessages
            .map(msg => `
                <div class="message ${msg.type}-message">
                    ${msg.content}
                </div>
            `).join('');
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('アプリケーションを初期化中...');
    try {
        window.app = new KaikeiApp();
        console.log('アプリケーションの初期化が完了しました');
    } catch (error) {
        console.error('アプリケーションの初期化中にエラーが発生しました:', error);
    }
}); 