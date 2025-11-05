// حالة التطبيق
let state = {
    cards: [],
    currentCardIndex: 0,
    points: 0,
    streak: 0,
    lastReviewDate: null,
    badges: []
};

// DOM Elements
let elements = {};

// تهيئة التطبيق
function init() {
    initializeElements();
    loadState();
    setupEventListeners();
    render();
}

// تهيئة عناصر DOM
function initializeElements() {
    elements = {
        points: document.getElementById('points'),
        streak: document.getElementById('streak'),
        badges: document.getElementById('badges'),
        dueCount: document.getElementById('dueCount'),
        cardFront: document.getElementById('cardFront'),
        cardBack: document.getElementById('cardBack'),
        showAnswerBtn: document.getElementById('showAnswerBtn'),
        ratingButtons: document.getElementById('ratingButtons'),
        addCardBtn: document.getElementById('addCardBtn'),
        importBtn: document.getElementById('importBtn'),
        cardModal: document.getElementById('cardModal'),
        cardForm: document.getElementById('cardForm'),
        cancelBtn: document.getElementById('cancelBtn')
    };
}

// تحميل الحالة من localStorage
function loadState() {
    const saved = localStorage.getItem('muraje3-state');
    if (saved) {
        const parsed = JSON.parse(saved);
        state = { ...state, ...parsed };
        checkStreak();
    } else {
        // بيانات تجريبية للبدء
        state.cards = [
            {
                id: 1,
                front: "ما هي أول خطوة في التكرار المتباعد؟",
                back: "المراجعة في الوقت المناسب قبل النسيان",
                nextReview: getTodayString(),
                interval: 1,
                ease: 2.5,
                reviews: 0
            },
            {
                id: 2,
                front: "ما فائدة نظام الحوافز في التعلم؟",
                back: "يزيد من الاستمرارية ويجعل العملية أكثر متعة",
                nextReview: getTodayString(),
                interval: 1,
                ease: 2.5,
                reviews: 0
            }
        ];
        saveState();
    }
}

// الحصول على تاريخ اليوم كـ string
function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

// حفظ الحالة في localStorage
function saveState() {
    localStorage.setItem('muraje3-state', JSON.stringify(state));
}

// التحقق من التسلسل
function checkStreak() {
    const today = getTodayString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (!state.lastReviewDate) {
        state.lastReviewDate = today;
        state.streak = 0;
    } else if (state.lastReviewDate === yesterdayStr) {
        state.streak++;
        state.lastReviewDate = today;
    } else if (state.lastReviewDate !== today) {
        state.streak = 0;
        state.lastReviewDate = today;
    }
    saveState();
}

// عرض الواجهة
function render() {
    renderStats();
    renderBadges();
    renderCurrentCard();
    updateDueCount();
}

// عرض الإحصائيات
function renderStats() {
    elements.points.textContent = state.points;
    elements.streak.textContent = state.streak;
}

// عرض الشارات
function renderBadges() {
    elements.badges.innerHTML = '';
    
    const allBadges = [
        { id: 'first', icon: '⭐', name: 'أول خطوة', earned: state.cards.length > 0 },
        { id: 'streak3', icon: '🔥', name: '3 أيام', earned: state.streak >= 3 },
        { id: 'streak7', icon: '🚀', name: 'أسبوع', earned: state.streak >= 7 },
        { id: 'points100', icon: '💎', name: '100 نقطة', earned: state.points >= 100 },
        { id: 'cards10', icon: '📚', name: '10 بطاقات', earned: state.cards.length >= 10 }
    ];
    
    allBadges.forEach(badge => {
        const badgeElement = document.createElement('div');
        badgeElement.className = `badge ${badge.earned ? 'earned' : ''}`;
        badgeElement.title = badge.name + (badge.earned ? ' - مكتسبة!' : ' - لم تكتسب بعد');
        badgeElement.textContent = badge.icon;
        elements.badges.appendChild(badgeElement);
        
        if (badge.earned && !state.badges.includes(badge.id)) {
            state.badges.push(badge.id);
            showAchievementMessage(`🎉 مبروك! لقد كسبت شارة ${badge.name}`);
        }
    });
}

// عرض رسالة الإنجاز
function showAchievementMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #D4A76A, #c0955a);
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 1001;
        font-weight: bold;
        animation: slideDown 0.5s ease;
    `;
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}

// عرض البطاقة الحالية
function renderCurrentCard() {
    const dueCards = getDueCards();
    
    if (dueCards.length === 0) {
        elements.cardFront.textContent = '🎉 لا توجد بطاقات للمراجعة اليوم!';
        elements.cardBack.textContent = 'يمكنك إضافة بطاقات جديدة أو العودة غداً';
        elements.showAnswerBtn.style.display = 'none';
        elements.ratingButtons.style.display = 'none';
        return;
    }
    
    // التأكد من أن الفهرس الحالي صالح
    if (state.currentCardIndex >= dueCards.length) {
        state.currentCardIndex = 0;
    }
    
    const currentCard = dueCards[state.currentCardIndex];
    elements.cardFront.textContent = currentCard.front;
    elements.cardBack.textContent = currentCard.back;
    elements.cardBack.style.display = 'none';
    
    elements.showAnswerBtn.style.display = 'block';
    elements.ratingButtons.style.display = 'none';
}

// الحصول على البطاقات المستحقة
function getDueCards() {
    const today = getTodayString();
    return state.cards.filter(card => card.nextReview <= today);
}

// تحديث عدد البطاقات المستحقة
function updateDueCount() {
    const dueCards = getDueCards();
    elements.dueCount.textContent = dueCards.length;
}

// إظهار الإجابة
function showAnswer() {
    elements.cardBack.style.display = 'block';
    elements.showAnswerBtn.style.display = 'none';
    elements.ratingButtons.style.display = 'flex';
}

// تقييم البطاقة
function rateCard(rating) {
    const dueCards = getDueCards();
    if (dueCards.length === 0) return;
    
    const currentCard = dueCards[state.currentCardIndex];
    
    // منح النقاط
    state.points += 10;
    
    // تحديث خوارزمية FSRS المبسطة
    updateCardSchedule(currentCard, rating);
    
    // التحقق من الإنجازات
    checkAchievements();
    
    // الانتقال للبطاقة التالية
    state.currentCardIndex = (state.currentCardIndex + 1) % dueCards.length;
    
    saveState();
    render();
}

// تحديث جدول البطاقة (خوارزمية FSRS مبسطة)
function updateCardSchedule(card, rating) {
    const today = new Date();
    
    switch(rating) {
        case 'easy':
            card.interval = card.interval ? card.interval * 2.5 : 6;
            card.ease = Math.min(card.ease ? card.ease + 0.15 : 2.5, 3.0);
            state.points += 5; // مكافأة إضافية للإجابة السهلة
            break;
        case 'good':
            card.interval = card.interval ? card.interval * 1.8 : 3;
            break;
        case 'hard':
            card.interval = card.interval ? card.interval * 1.2 : 1;
            card.ease = Math.max(card.ease ? card.ease - 0.15 : 2.5, 1.3);
            break;
    }
    
    card.reviews = (card.reviews || 0) + 1;
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + Math.round(card.interval));
    card.nextReview = nextDate.toISOString().split('T')[0];
}

// التحقق من الإنجازات
function checkAchievements() {
    // منح نقاط إضافية لإكمال التسلسل
    if (state.streak > 0 && state.streak % 7 === 0) {
        state.points += 50;
        showAchievementMessage('🎊 مبروك! أسبوع كامل من المراجعة! +50 نقطة');
    }
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // زر إظهار الإجابة
    elements.showAnswerBtn.addEventListener('click', showAnswer);
    
    // أزرار التقييم
    document.querySelectorAll('.rating-buttons .btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            rateCard(e.target.dataset.rating);
        });
    });
    
    // إنشاء بطاقة جديدة
    elements.addCardBtn.addEventListener('click', () => {
        elements.cardModal.style.display = 'flex';
    });
    
    // إلغاء النافذة المنبثقة
    elements.cancelBtn.addEventListener('click', () => {
        elements.cardModal.style.display = 'none';
        elements.cardForm.reset();
    });
    
    // حفظ البطاقة الجديدة
    elements.cardForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const frontInput = document.getElementById('cardFrontInput');
        const backInput = document.getElementById('cardBackInput');
        
        const front = frontInput.value.trim();
        const back = backInput.value.trim();
        
        if (!front || !back) {
            alert('يرجى ملء كل من السؤال والإجابة');
            return;
        }
        
        const newCard = {
            id: Date.now(),
            front: front,
            back: back,
            nextReview: getTodayString(),
            interval: 1,
            ease: 2.5,
            reviews: 0
        };
        
        state.cards.push(newCard);
        saveState();
        
        elements.cardModal.style.display = 'none';
        elements.cardForm.reset();
        
        render();
        
        // منح نقاط لإنشاء بطاقة جديدة
        state.points += 5;
        saveState();
        render();
        
        showAchievementMessage('✨ بطاقة جديدة مضافة! +5 نقاط');
    });
    
    // استيراد من Anki
    elements.importBtn.addEventListener('click', () => {
        alert('ميزة الاستيراد من Anki قيد التطوير. يمكنك إضافة البطاقات يدوياً باستخدام زر "إنشاء بطاقة جديدة"');
    });
    
    // إغلاق النافذة المنبثقة بالنقر خارجها
    elements.cardModal.addEventListener('click', (e) => {
        if (e.target === elements.cardModal) {
            elements.cardModal.style.display = 'none';
            elements.cardForm.reset();
        }
    });
}

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', init);
