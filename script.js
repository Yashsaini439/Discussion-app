let questions = [];
let activeQuestionId = null;

// DOM Elements
const rightPane = document.getElementById('rightPane');
const questionList = document.getElementById('questionList');
const searchInput = document.getElementById('searchInput');
const newQuestionBtn = document.getElementById('newQuestionBtn');

// Initial render
renderQuestionForm();

// Event Listeners
newQuestionBtn.addEventListener('click', renderQuestionForm);
searchInput.addEventListener('input', renderQuestions);

// Render Question Creation Form 
function renderQuestionForm() {
  activeQuestionId = null;
  rightPane.innerHTML = `
    <h2>Welcome to Discussion Portal!</h2>
    <p style="color: #666; margin-bottom: 20px;">Enter a subject and question to get started</p>
    <form id="questionForm">
      <div class="form-group">
        <input type="text" id="subjectInput" placeholder="Subject" required />
      </div>
      <div class="form-group">
        <textarea id="questionInput" placeholder="Question" required></textarea>
      </div>
      <button type="submit" class="btn-primary" style="float: right;">Submit</button>
    </form>
  `;

  document.getElementById('questionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('subjectInput').value.trim();
    const text = document.getElementById('questionInput').value.trim();

    if (title && text) {
      const newQuestion = {
        id: Date.now(),
        title: title,
        text: text,
        responses: [],
        isFavorite: false,
        upvotes: 0
      };
      questions.push(newQuestion); 
      renderQuestions();
      renderQuestionForm();
    }
  });
}

// Render Active Question & Response Form 
function renderDetailPane(question) {
  activeQuestionId = question.id;
  
  let responsesHTML = question.responses.map(res => `
    <div class="response-card">
      <h4>${escapeHTML(res.name)}</h4>
      <p>${escapeHTML(res.comment)}</p>
      <div style="margin-top: 5px; font-size: 12px; color: #555;">
        <span>Votes: ${res.upvotes}</span>
        <button onclick="voteResponse(${question.id}, ${res.id}, 1)" class="vote-btns">▲</button>
        <button onclick="voteResponse(${question.id}, ${res.id}, -1)" class="vote-btns">▼</button>
      </div>
    </div>
  `).join('');

  rightPane.innerHTML = `
    <h3>Question</h3>
    <div style="background: #f4f6f8; padding: 15px; border-radius: 4px; margin: 10px 0;">
      <h4>${escapeHTML(question.title)}</h4>
      <p>${escapeHTML(question.text)}</p>
    </div>
    <button class="resolve-btn" id="resolveBtn">Resolve</button>
    
    <hr style="margin: 20px 0;">
    
    <h3>Response</h3>
    <div class="response-list" id="responseList">
      ${responsesHTML || '<p style="color: #888;">No responses yet.</p>'}
    </div>

    <h3 style="margin-top: 20px;">Add Response</h3>
    <form id="responseForm" style="margin-top: 10px;">
      <div class="form-group">
        <input type="text" id="responderName" placeholder="Enter Name" required />
      </div>
      <div class="form-group">
        <textarea id="responderComment" placeholder="Enter Comment" required></textarea>
      </div>
      <button type="submit" class="btn-primary" style="float: right;">Submit</button>
    </form>
  `;

  // Resolve Button Click 
  document.getElementById('resolveBtn').addEventListener('click', () => {
    questions = questions.filter(q => q.id !== question.id);
    renderQuestions();
    renderQuestionForm();
  });

  // Submit Response Form 
  document.getElementById('responseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('responderName').value.trim();
    const comment = document.getElementById('responderComment').value.trim();

    if (name && comment) {
      question.responses.push({
        id: Date.now(),
        name: name,
        comment: comment,
        upvotes: 0
      });
      renderQuestions();
      renderDetailPane(question);
    }
  });
}

// Render Question List with Sorting, Favorites, Upvotes & Search Highlighting 
function renderQuestions() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  
  // Filter questions based on search 
  let filtered = questions.filter(q => 
    q.title.toLowerCase().includes(searchTerm) || 
    q.text.toLowerCase().includes(searchTerm)
  );

  // Sort: Favorites first, then by highest upvotes 
  filtered.sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return b.isFavorite - a.isFavorite;
    return b.upvotes - a.upvotes;
  });

  questionList.innerHTML = '';

  if (filtered.length === 0) {
    questionList.innerHTML = '<p style="color: #888; text-align: center; margin-top: 20px;">No questions found</p>';
    return;
  }

  filtered.forEach(q => {
    const card = document.createElement('div');
    card.className = 'question-card';
    
    const highlightedTitle = highlightText(q.title, searchTerm); 
    const highlightedText = highlightText(q.text, searchTerm);

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <h4>${highlightedTitle}</h4>
        <span class="star ${q.isFavorite ? 'starred' : ''}" onclick="toggleFavorite(event, ${q.id})">★</span>
      </div>
      <p>${highlightedText}</p>
      <div class="card-footer">
        <div>
          <span>Votes: <strong>${q.upvotes}</strong></span>
          <button class="vote-btns" onclick="voteQuestion(event, ${q.id}, 1)">▲</button>
          <button class="vote-btns" onclick="voteQuestion(event, ${q.id}, -1)">▼</button>
        </div>
        <small>${q.responses.length} response(s)</small>
      </div>
    `;

    card.addEventListener('click', () => renderDetailPane(q));
    questionList.appendChild(card);
  });
}

// Upvote / Downvote Question 
function voteQuestion(e, id, val) {
  e.stopPropagation();
  const q = questions.find(item => item.id === id);
  if (q) {
    q.upvotes += val;
    renderQuestions();
  }
}

// Upvote / Downvote Response 
function voteResponse(qId, rId, val) {
  const q = questions.find(item => item.id === qId);
  if (q) {
    const r = q.responses.find(res => res.id === rId);
    if (r) {
      r.upvotes += val;
      // Sort responses by upvotes
      q.responses.sort((a, b) => b.upvotes - a.upvotes);
      renderDetailPane(q);
    }
  }
}

// Favorite Question 
function toggleFavorite(e, id) {
  e.stopPropagation();
  const q = questions.find(item => item.id === id);
  if (q) {
    q.isFavorite = !q.isFavorite;
    renderQuestions();
  }
}

// Text Highlighting Function 
function highlightText(text, term) {
  const safeText = escapeHTML(text);
  if (!term) return safeText;
  const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
  return safeText.replace(regex, '<span class="highlight">$1</span>');
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}