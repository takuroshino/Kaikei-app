class KaikeiApp {
    constructor() {
        this.transactions = [];
        this.form = document.getElementById('transactionForm');
        this.transactionList = document.getElementById('transactionList');
        this.balanceElement = document.getElementById('balance');
        this.cameraButton = document.getElementById('cameraButton');
        this.preview = document.getElementById('preview');
        
        this.initializeEventListeners();
        this.loadTransactions();
        this.initializeCameraFeature();
        
        // データの暗号化
        this.encryptionKey = localStorage.getItem('encryptionKey') || this.generateEncryptionKey();

        // APIキーを保存する場所
        let apiKey = localStorage.getItem('googleApiKey');

        // 起動時にAPIキーをチェック
        if (!apiKey) {
            apiKey = prompt('Google Cloud VisionのAPIキーを入力してください：');
            if (apiKey) {
                localStorage.setItem('googleApiKey', apiKey);
            }
        }

        // APIキーを使う時
        const GOOGLE_API_KEY = apiKey;
    }

    generateEncryptionKey() {
        const key = Math.random().toString(36).substring(2);
        localStorage.setItem('encryptionKey', key);
        return key;
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });
    }

    initializeCameraFeature() {
        this.cameraButton.addEventListener('click', () => {
            this.captureReceipt();
        });
    }

    addTransaction() {
        const transaction = {
            date: document.getElementById('date').value,
            type: document.getElementById('type').value,
            category: document.getElementById('category').value,
            amount: parseFloat(document.getElementById('amount').value),
            description: document.getElementById('description').value,
            id: Date.now()
        };

        this.transactions.push(transaction);
        this.saveTransactions();
        this.updateUI();
        this.form.reset();
    }

    saveTransactions() {
        // データを暗号化して保存
        const encrypted = this.encrypt(JSON.stringify(this.transactions));
        localStorage.setItem('transactions', encrypted);
    }

    loadTransactions() {
        const saved = localStorage.getItem('transactions');
        if (saved) {
            // 暗号化されたデータを復号
            const decrypted = this.decrypt(saved);
            this.transactions = JSON.parse(decrypted);
            this.updateUI();
        }
    }

    calculateBalance() {
        return this.transactions.reduce((total, transaction) => {
            if (transaction.type === 'income') {
                return total + transaction.amount;
            } else {
                return total - transaction.amount;
            }
        }, 0);
    }

    updateUI() {
        // 残高の更新
        const balance = this.calculateBalance();
        this.balanceElement.textContent = `残高: ¥${balance.toLocaleString()}`;

        // 取引履歴の更新
        this.transactionList.innerHTML = '<h2>取引履歴</h2>';
        this.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(transaction => {
                const div = document.createElement('div');
                div.className = 'transaction-item';
                div.innerHTML = `
                    <div>
                        ${transaction.date} - ${transaction.category}
                        <br>
                        <small>${transaction.description}</small>
                    </div>
                    <div style="color: ${transaction.type === 'income' ? 'green' : 'red'}">
                        ¥${transaction.amount.toLocaleString()}
                    </div>
                `;
                this.transactionList.appendChild(div);
            });
    }

    async captureReceipt() {
        try {
            // ファイル選択ダイアログを表示
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = 'environment'; // 背面カメラを使用
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        this.preview.src = event.target.result;
                        this.preview.style.display = 'block';
                        
                        // 画像データを取得（base64形式）
                        const imageData = event.target.result.split(',')[1];
                        
                        // レシートを分析
                        await analyzeReceipt(imageData);
                        
                        // とりあえず日付は今日の日付を設定
                        document.getElementById('date').value = new Date().toISOString().split('T')[0];
                        // 種類は支出に設定
                        document.getElementById('type').value = 'expense';
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

    encrypt(text) {
        // 簡単な暗号化（実際のアプリではより強力な暗号化を使用）
        return btoa(text);
    }

    decrypt(encrypted) {
        // 暗号化されたデータを復号
        return atob(encrypted);
    }
}

// アプリケーションの初期化
window.addEventListener('DOMContentLoaded', () => {
    new KaikeiApp();
    const apiKey = localStorage.getItem('googleApiKey');
    if (apiKey) {
        document.getElementById('apiKeyStatus').textContent = 
            'ステータス：設定済み（レシートの自動読み取りが使えます）';
        document.getElementById('apiKeyStatus').style.color = '#4CAF50';
    }
});

// APIキーを保存
function saveApiKey() {
    const apiKey = document.getElementById('apiKeyInput').value;
    if (apiKey) {
        localStorage.setItem('googleApiKey', apiKey);
        document.getElementById('apiKeyStatus').textContent = 
            'ステータス：設定済み（レシートの自動読み取りが使えます）';
        document.getElementById('apiKeyStatus').style.color = '#4CAF50';
        alert('APIキーを保存しました！');
    } else {
        alert('APIキーを入力してください');
    }
}

// レシート分析時にAPIキーを使用
async function analyzeReceipt(imageData) {
    const apiKey = localStorage.getItem('googleApiKey');
    if (!apiKey) {
        alert('APIキーが設定されていません。設定画面で設定してください。');
        return;
    }

    try {
        // デバッグ用：APIリクエストが始まったことを確認
        alert('レシートの分析を開始します');

        const response = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    requests: [{
                        image: {
                            content: imageData
                        },
                        features: [
                            { type: 'TEXT_DETECTION' }
                        ]
                    }]
                })
            }
        );

        // デバッグ用：レスポンスの確認
        const result = await response.json();
        alert('Googleからの応答: ' + JSON.stringify(result).substring(0, 100));

        if (result.error) {
            throw new Error(result.error.message);
        }

        // レシートの文字を解析して自動入力
        const text = result.responses[0].textAnnotations[0].description;
        
        // 金額を探す（例：¥1,000 や 1000円 などのパターン）
        const amountMatch = text.match(/[¥￥][\d,]+|[\d,]+円/);
        if (amountMatch) {
            const amount = amountMatch[0].replace(/[¥￥円,]/g, '');
            document.getElementById('amount').value = amount;
        }

        // 日付を探す（例：2024/02/20 や 2024-02-20 などのパターン）
        const dateMatch = text.match(/\d{4}[-\/]\d{2}[-\/]\d{2}/);
        if (dateMatch) {
            document.getElementById('date').value = dateMatch[0].replace(/\//g, '-');
        }

        // 店名っぽい行を説明に入れる
        const lines = text.split('\n');
        if (lines.length > 0) {
            document.getElementById('description').value = lines[0];
        }

    } catch (error) {
        // より詳細なエラーメッセージ
        alert('エラーの詳細: ' + error.message + '\n\nエラーの種類: ' + error.name);
    }
} 