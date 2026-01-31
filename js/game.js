// NumberBlocks Game - Main Game Logic
// A fun, toddler-friendly Tetris-style game with voice and music!

class NumberBlocksGame {
  constructor() {
    // Game configuration
    this.COLS = 8;
    this.ROWS = 12;
    this.board = [];
    this.score = 0;
    this.level = 1;
    this.isPlaying = false;
    this.isPaused = false;
    this.soundEnabled = true;
    this.musicEnabled = true;
    
    // Current and next block
    this.currentBlock = null;
    this.nextBlock = null;
    this.currentCol = 3;
    this.currentRow = 0;
    
    // Game timing
    this.dropInterval = null;
    this.dropSpeed = 1500; // milliseconds
    
    // Level data
    this.levels = null;
    this.combos = null;
    
    // Sprites mapping
    this.sprites = {
      1: 'sprites/one.svg',
      2: 'sprites/two.svg',
      3: 'sprites/three.svg',
      4: 'sprites/four.svg',
      5: 'sprites/five.svg',
      6: 'sprites/six.svg',
      7: 'sprites/seven.svg',
      8: 'sprites/eight.svg',
      9: 'sprites/nine.svg',
      10: 'sprites/ten.svg'
    };
    
    // Character names for speech
    this.names = {
      1: 'One',
      2: 'Two',
      3: 'Three',
      4: 'Four',
      5: 'Five',
      6: 'Six',
      7: 'Seven',
      8: 'Eight',
      9: 'Nine',
      10: 'Ten'
    };
    
    // Audio system
    this.audioContext = null;
    this.musicGainNode = null;
    this.effectsGainNode = null;
    this.musicPlaying = false;
    this.musicNodes = [];
    
    // Speech synthesis
    this.synth = window.speechSynthesis;
    this.selectedVoice = null;
    this.isSpeaking = false;
    
    // DOM elements
    this.gameBoard = document.getElementById('game-board');
    this.scoreDisplay = document.getElementById('score');
    this.levelDisplay = document.getElementById('level');
    this.nextBlockPreview = document.getElementById('next-block');
    this.startScreen = document.getElementById('start-screen');
    this.gameOverScreen = document.getElementById('game-over');
    this.comboDisplay = document.getElementById('combo-display');
    this.backgroundMusic = document.getElementById('background-music');
    
    // Initialize
    this.init();
  }
  
  async init() {
    // Load level data
    await this.loadLevelData();
    
    // Create game board grid
    this.createBoard();
    
    // Setup event listeners
    this.setupControls();
    
    // Preload images
    this.preloadImages();
    
    // Initialize speech
    this.initSpeech();
    
    console.log('NumberBlocks Game initialized!');
  }
  
  initSpeech() {
    // Wait for voices to load
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.selectVoice();
    }
    // Try to select immediately too
    setTimeout(() => this.selectVoice(), 100);
  }
  
  selectVoice() {
    const voices = this.synth.getVoices();
    
    // Prefer child-friendly voices
    const preferredVoices = [
      'Samantha', // macOS - friendly female
      'Karen',    // macOS - Australian
      'Moira',    // macOS - Irish
      'Google UK English Female',
      'Microsoft Zira',
      'Google US English'
    ];
    
    for (const preferred of preferredVoices) {
      const found = voices.find(v => v.name.includes(preferred));
      if (found) {
        this.selectedVoice = found;
        console.log('Selected voice:', found.name);
        return;
      }
    }
    
    // Fallback to first English voice
    this.selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (this.selectedVoice) {
      console.log('Using fallback voice:', this.selectedVoice.name);
    }
  }
  
  speakNumber(number, excited = false) {
    if (!this.soundEnabled || !this.synth) return;
    
    // Cancel any ongoing speech
    this.synth.cancel();
    
    const name = this.names[number];
    if (!name) return;
    
    // Duck the music while speaking
    this.duckMusic(true);
    this.isSpeaking = true;
    
    const utterance = new SpeechSynthesisUtterance(excited ? name + '!' : name);
    
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    
    // Make it sound fun and child-friendly
    utterance.rate = excited ? 0.9 : 0.85;  // Slightly slower for clarity
    utterance.pitch = excited ? 1.4 : 1.2;  // Higher pitch for kid-friendly sound
    utterance.volume = 1.0;
    
    utterance.onend = () => {
      this.isSpeaking = false;
      this.duckMusic(false);
    };
    
    utterance.onerror = () => {
      this.isSpeaking = false;
      this.duckMusic(false);
    };
    
    this.synth.speak(utterance);
  }
  
  speakPhrase(phrase) {
    if (!this.soundEnabled || !this.synth) return;
    
    this.synth.cancel();
    this.duckMusic(true);
    this.isSpeaking = true;
    
    const utterance = new SpeechSynthesisUtterance(phrase);
    
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 1.3;
    utterance.volume = 1.0;
    
    utterance.onend = () => {
      this.isSpeaking = false;
      this.duckMusic(false);
    };
    
    utterance.onerror = () => {
      this.isSpeaking = false;
      this.duckMusic(false);
    };
    
    this.synth.speak(utterance);
  }
  
  duckMusic(duck) {
    if (!this.musicGainNode) return;
    
    const targetVolume = duck ? 0.1 : 0.3;
    const currentTime = this.audioContext.currentTime;
    
    this.musicGainNode.gain.cancelScheduledValues(currentTime);
    this.musicGainNode.gain.setValueAtTime(this.musicGainNode.gain.value, currentTime);
    this.musicGainNode.gain.linearRampToValueAtTime(targetVolume, currentTime + 0.1);
  }
  
  async loadLevelData() {
    try {
      const response = await fetch('levels/levels.json');
      const data = await response.json();
      this.levels = data.levels;
      this.combos = data.combos;
    } catch (error) {
      console.warn('Could not load levels.json, using defaults');
      this.levels = [{ level: 1, speed: 1500, maxNumber: 5, targetScore: 100 }];
      this.combos = {
        "1+1": { result: 2, points: 10, celebration: "🎉" },
        "1+2": { result: 3, points: 15, celebration: "⭐" },
        "2+1": { result: 3, points: 15, celebration: "⭐" },
        "2+2": { result: 4, points: 20, celebration: "🌟" },
        "2+3": { result: 5, points: 25, celebration: "✨" },
        "3+2": { result: 5, points: 25, celebration: "✨" }
      };
    }
  }
  
  createBoard() {
    this.gameBoard.innerHTML = '';
    this.board = [];
    
    for (let row = 0; row < this.ROWS; row++) {
      this.board[row] = [];
      for (let col = 0; col < this.COLS; col++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        this.gameBoard.appendChild(cell);
        this.board[row][col] = 0;
      }
    }
  }
  
  preloadImages() {
    Object.values(this.sprites).forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }
  
  setupControls() {
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const playBtn = document.getElementById('play-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const exitBtn = document.getElementById('exit-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const soundBtn = document.getElementById('sound-btn');
    const musicBtn = document.getElementById('music-btn');
    
    // Play button
    playBtn.addEventListener('click', () => this.startGame());
    playBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.startGame();
    });
    
    // Play again button
    playAgainBtn.addEventListener('click', () => this.restartGame());
    playAgainBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.restartGame();
    });
    
    // Left button
    leftBtn.addEventListener('mousedown', () => this.moveLeft());
    leftBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.moveLeft();
    });
    
    // Right button
    rightBtn.addEventListener('mousedown', () => this.moveRight());
    rightBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.moveRight();
    });
    
    // Exit button
    exitBtn.addEventListener('click', () => this.showExitConfirm());
    
    // Fullscreen button
    fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    
    // Sound toggle
    soundBtn.addEventListener('click', () => this.toggleSound());
    
    // Music toggle
    if (musicBtn) {
      musicBtn.addEventListener('click', () => this.toggleMusic());
    }
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (!this.isPlaying) return;
      
      switch(e.key) {
        case 'ArrowLeft':
        case 'a':
          this.moveLeft();
          break;
        case 'ArrowRight':
        case 'd':
          this.moveRight();
          break;
        case 'ArrowDown':
        case 's':
          this.dropFaster();
          break;
      }
    });
    
    // Swipe controls
    let touchStartX = 0;
    this.gameBoard.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    });
    
    this.gameBoard.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchEndX - touchStartX;
      
      if (Math.abs(diff) > 30) {
        if (diff > 0) {
          this.moveRight();
        } else {
          this.moveLeft();
        }
      }
    });
  }
  
  startGame() {
    this.startScreen.classList.add('hidden');
    this.gameOverScreen.classList.remove('show');
    this.isPlaying = true;
    this.score = 0;
    this.level = 1;
    this.updateScore();
    this.updateLevel();
    
    // Reset board
    this.createBoard();
    
    // Initialize audio
    this.initAudio();
    
    // Play background music video
    if (this.backgroundMusic) {
      this.backgroundMusic.play().catch(err => {
        console.log('Could not play background music:', err);
      });
    }
    
    // Start background music
    this.startBackgroundMusic();
    
    // Spawn first blocks
    this.nextBlock = this.generateBlock();
    this.spawnBlock();
    
    // Start game loop
    this.startDropping();
    
    // Welcome message
    setTimeout(() => {
      this.speakPhrase("Let's count!");
    }, 300);
  }
  
  restartGame() {
    this.stopBackgroundMusic();
    this.gameOverScreen.classList.remove('show');
    this.startGame();
  }
  
  generateBlock() {
    const levelConfig = this.levels.find(l => l.level === this.level) || this.levels[0];
    const maxNum = levelConfig.maxNumber || 5;
    
    const weights = [];
    for (let i = 1; i <= maxNum; i++) {
      const weight = maxNum - i + 2;
      for (let j = 0; j < weight; j++) {
        weights.push(i);
      }
    }
    
    return weights[Math.floor(Math.random() * weights.length)];
  }
  
  spawnBlock() {
    this.currentBlock = this.nextBlock;
    this.nextBlock = this.generateBlock();
    this.currentCol = Math.floor(this.COLS / 2);
    this.currentRow = 0;
    
    this.updateNextPreview();
    
    if (this.board[0][this.currentCol] !== 0) {
      this.gameOver();
      return;
    }
    
    this.renderCurrentBlock();
    
    // Say the number name when block appears!
    this.speakNumber(this.currentBlock, false);
    
    this.playSound('spawn');
  }
  
  updateNextPreview() {
    this.nextBlockPreview.innerHTML = '';
    const img = document.createElement('img');
    img.src = this.sprites[this.nextBlock];
    img.alt = this.names[this.nextBlock];
    this.nextBlockPreview.appendChild(img);
  }
  
  renderCurrentBlock() {
    const cells = this.gameBoard.querySelectorAll('.cell');
    cells.forEach(cell => {
      const block = cell.querySelector('.numberblock.active');
      if (block) block.remove();
    });
    
    const cellIndex = this.currentRow * this.COLS + this.currentCol;
    const cell = cells[cellIndex];
    
    if (cell) {
      const block = document.createElement('div');
      block.className = 'numberblock active';
      block.dataset.value = this.currentBlock;
      
      const img = document.createElement('img');
      img.src = this.sprites[this.currentBlock];
      img.alt = this.names[this.currentBlock];
      block.appendChild(img);
      
      cell.appendChild(block);
    }
  }
  
  startDropping() {
    const levelConfig = this.levels.find(l => l.level === this.level) || this.levels[0];
    this.dropSpeed = levelConfig.speed || 1500;
    
    if (this.dropInterval) clearInterval(this.dropInterval);
    
    this.dropInterval = setInterval(() => {
      if (this.isPlaying && !this.isPaused) {
        this.dropBlock();
      }
    }, this.dropSpeed);
  }
  
  dropBlock() {
    const nextRow = this.currentRow + 1;
    
    if (nextRow >= this.ROWS || this.board[nextRow][this.currentCol] !== 0) {
      this.landBlock();
    } else {
      this.currentRow = nextRow;
      this.renderCurrentBlock();
    }
  }
  
  dropFaster() {
    while (this.currentRow + 1 < this.ROWS && this.board[this.currentRow + 1][this.currentCol] === 0) {
      this.currentRow++;
    }
    this.renderCurrentBlock();
    this.landBlock();
  }
  
  landBlock() {
    this.board[this.currentRow][this.currentCol] = this.currentBlock;
    
    const cells = this.gameBoard.querySelectorAll('.cell');
    const cellIndex = this.currentRow * this.COLS + this.currentCol;
    const cell = cells[cellIndex];
    
    const activeBlock = cell.querySelector('.numberblock.active');
    if (activeBlock) {
      activeBlock.classList.remove('active');
    }
    
    this.playSound('land');
    
    // Check for combinations
    this.checkCombinations(this.currentRow, this.currentCol);
    
    // Spawn next block
    setTimeout(() => {
      if (this.isPlaying) {
        this.spawnBlock();
      }
    }, 400);
  }
  
  moveLeft() {
    if (!this.isPlaying || this.isPaused) return;
    
    const nextCol = this.currentCol - 1;
    if (nextCol >= 0 && this.board[this.currentRow][nextCol] === 0) {
      this.currentCol = nextCol;
      this.renderCurrentBlock();
      this.playSound('move');
    }
  }
  
  moveRight() {
    if (!this.isPlaying || this.isPaused) return;
    
    const nextCol = this.currentCol + 1;
    if (nextCol < this.COLS && this.board[this.currentRow][nextCol] === 0) {
      this.currentCol = nextCol;
      this.renderCurrentBlock();
      this.playSound('move');
    }
  }
  
  checkCombinations(row, col) {
    const currentValue = this.board[row][col];
    if (currentValue === 0 || currentValue >= 10) return;
    
    const directions = [
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 },
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 }
    ];
    
    for (const dir of directions) {
      const newRow = row + dir.dr;
      const newCol = col + dir.dc;
      
      if (newRow < 0 || newRow >= this.ROWS || newCol < 0 || newCol >= this.COLS) continue;
      
      const adjacentValue = this.board[newRow][newCol];
      if (adjacentValue === 0) continue;
      
      const comboKey = `${currentValue}+${adjacentValue}`;
      const combo = this.combos[comboKey];
      
      if (combo && combo.result <= 10) {
        this.performCombination(row, col, newRow, newCol, combo);
        return;
      }
    }
  }
  
  performCombination(row1, col1, row2, col2, combo) {
    const cells = this.gameBoard.querySelectorAll('.cell');
    
    const cell1Index = row1 * this.COLS + col1;
    const cell2Index = row2 * this.COLS + col2;
    
    const block1 = cells[cell1Index].querySelector('.numberblock');
    const block2 = cells[cell2Index].querySelector('.numberblock');
    
    if (block1) block1.classList.add('combining');
    if (block2) block2.classList.add('combining');
    
    this.playSound('combine');
    
    setTimeout(() => {
      this.board[row1][col1] = 0;
      this.board[row2][col2] = 0;
      if (block1) block1.remove();
      if (block2) block2.remove();
      
      const targetRow = Math.max(row1, row2);
      const targetCol = col1;
      
      this.board[targetRow][targetCol] = combo.result;
      
      const targetCellIndex = targetRow * this.COLS + targetCol;
      const targetCell = cells[targetCellIndex];
      
      const newBlock = document.createElement('div');
      newBlock.className = 'numberblock';
      newBlock.dataset.value = combo.result;
      
      const img = document.createElement('img');
      img.src = this.sprites[combo.result];
      img.alt = this.names[combo.result];
      newBlock.appendChild(img);
      
      targetCell.appendChild(newBlock);
      
      this.showCelebration(targetCell, combo.celebration);
      
      // SAY THE NEW NUMBER NAME WITH EXCITEMENT!
      this.speakNumber(combo.result, true);
      
      this.score += combo.points;
      this.updateScore();
      
      this.checkLevelUp();
      this.applyGravity();
      
      setTimeout(() => {
        this.checkCombinations(targetRow, targetCol);
      }, 500);
      
    }, 400);
  }
  
  showCelebration(cell, emoji) {
    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    celebration.textContent = emoji;
    celebration.style.left = cell.offsetLeft + cell.offsetWidth / 2 + 'px';
    celebration.style.top = cell.offsetTop + 'px';
    this.gameBoard.appendChild(celebration);
    
    this.comboDisplay.textContent = emoji;
    this.comboDisplay.classList.add('show');
    
    setTimeout(() => {
      celebration.remove();
      this.comboDisplay.classList.remove('show');
    }, 1000);
  }
  
  applyGravity() {
    for (let col = 0; col < this.COLS; col++) {
      for (let row = this.ROWS - 1; row >= 0; row--) {
        if (this.board[row][col] === 0) {
          for (let aboveRow = row - 1; aboveRow >= 0; aboveRow--) {
            if (this.board[aboveRow][col] !== 0) {
              this.board[row][col] = this.board[aboveRow][col];
              this.board[aboveRow][col] = 0;
              
              this.updateCellVisual(aboveRow, col, 0);
              this.updateCellVisual(row, col, this.board[row][col]);
              
              break;
            }
          }
        }
      }
    }
  }
  
  updateCellVisual(row, col, value) {
    const cells = this.gameBoard.querySelectorAll('.cell');
    const cellIndex = row * this.COLS + col;
    const cell = cells[cellIndex];
    
    const existingBlock = cell.querySelector('.numberblock:not(.active)');
    if (existingBlock) existingBlock.remove();
    
    if (value > 0) {
      const block = document.createElement('div');
      block.className = 'numberblock';
      block.dataset.value = value;
      
      const img = document.createElement('img');
      img.src = this.sprites[value];
      img.alt = this.names[value];
      block.appendChild(img);
      
      cell.appendChild(block);
    }
  }
  
  updateScore() {
    this.scoreDisplay.textContent = this.score;
  }
  
  updateLevel() {
    this.levelDisplay.textContent = this.level;
  }
  
  checkLevelUp() {
    const levelConfig = this.levels.find(l => l.level === this.level);
    if (levelConfig && this.score >= levelConfig.targetScore) {
      const nextLevel = this.levels.find(l => l.level === this.level + 1);
      if (nextLevel) {
        this.level++;
        this.updateLevel();
        this.startDropping();
        this.playSound('levelup');
        
        this.comboDisplay.textContent = '🎉 Level ' + this.level + '! 🎉';
        this.comboDisplay.classList.add('show');
        
        // Announce level up
        setTimeout(() => {
          this.speakPhrase('Level ' + this.level + '! Amazing!');
        }, 200);
        
        setTimeout(() => {
          this.comboDisplay.classList.remove('show');
        }, 2000);
      }
    }
  }
  
  gameOver() {
    this.isPlaying = false;
    if (this.dropInterval) clearInterval(this.dropInterval);
    
    // Pause background music video
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
    }
    
    this.stopBackgroundMusic();
    this.playSound('gameover');
    
    // Encouraging message
    setTimeout(() => {
      this.speakPhrase('Great job! You scored ' + this.score + '!');
    }, 500);
    
    document.getElementById('final-score-value').textContent = this.score;
    this.gameOverScreen.classList.add('show');
  }
  
  showExitConfirm() {
    if (confirm('Exit the game?')) {
      this.isPlaying = false;
      
      // Pause background music video
      if (this.backgroundMusic) {
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0; // Reset to beginning
      }
      
      this.stopBackgroundMusic();
      if (this.dropInterval) clearInterval(this.dropInterval);
      this.startScreen.classList.remove('hidden');
      this.gameOverScreen.classList.remove('show');
      this.createBoard();
    }
  }
  
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Fullscreen not available:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }
  
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    const soundBtn = document.getElementById('sound-btn');
    soundBtn.textContent = this.soundEnabled ? '🔊' : '🔇';
    soundBtn.classList.toggle('muted', !this.soundEnabled);
    
    if (!this.soundEnabled) {
      this.synth.cancel();
    }
  }
  
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    const musicBtn = document.getElementById('music-btn');
    if (musicBtn) {
      musicBtn.textContent = this.musicEnabled ? '🎵' : '🎵';
      musicBtn.classList.toggle('muted', !this.musicEnabled);
    }
    
    if (this.musicEnabled && this.isPlaying) {
      this.startBackgroundMusic();
    } else {
      this.stopBackgroundMusic();
    }
  }
  
  initAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create gain nodes for music and effects
      this.musicGainNode = this.audioContext.createGain();
      this.musicGainNode.gain.value = 0.3;
      this.musicGainNode.connect(this.audioContext.destination);
      
      this.effectsGainNode = this.audioContext.createGain();
      this.effectsGainNode.gain.value = 0.4;
      this.effectsGainNode.connect(this.audioContext.destination);
    }
    
    // Resume if suspended (required for mobile)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
  
  startBackgroundMusic() {
    if (!this.musicEnabled || !this.audioContext || this.musicPlaying) return;
    
    this.musicPlaying = true;
    this.playMusicLoop();
  }
  
  playMusicLoop() {
    if (!this.musicPlaying || !this.audioContext) return;
    
    // Fun, playful melody using simple notes
    // C major pentatonic scale - kid-friendly!
    const notes = [
      { note: 'C4', duration: 0.25 },
      { note: 'E4', duration: 0.25 },
      { note: 'G4', duration: 0.25 },
      { note: 'A4', duration: 0.25 },
      { note: 'G4', duration: 0.25 },
      { note: 'E4', duration: 0.25 },
      { note: 'C4', duration: 0.5 },
      { note: 'D4', duration: 0.25 },
      { note: 'E4', duration: 0.25 },
      { note: 'G4', duration: 0.25 },
      { note: 'A4', duration: 0.25 },
      { note: 'C5', duration: 0.5 },
      { note: 'A4', duration: 0.25 },
      { note: 'G4', duration: 0.25 },
      { note: 'E4', duration: 0.25 },
      { note: 'D4', duration: 0.25 },
      { note: 'C4', duration: 0.5 },
    ];
    
    const noteFrequencies = {
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
      'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25,
      'D5': 587.33, 'E5': 659.25
    };
    
    let currentTime = this.audioContext.currentTime;
    const tempo = 0.35; // seconds per beat unit
    
    notes.forEach((noteData, index) => {
      const oscillator = this.audioContext.createOscillator();
      const noteGain = this.audioContext.createGain();
      
      oscillator.connect(noteGain);
      noteGain.connect(this.musicGainNode);
      
      oscillator.frequency.value = noteFrequencies[noteData.note];
      oscillator.type = 'sine';
      
      const noteDuration = noteData.duration * tempo;
      const startTime = currentTime + (index * 0.18);
      
      // Soft attack and release
      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      noteGain.gain.linearRampToValueAtTime(0, startTime + noteDuration - 0.02);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + noteDuration);
      
      this.musicNodes.push(oscillator);
    });
    
    // Add a bass line
    const bassNotes = ['C3', 'G2', 'A2', 'E2'];
    const bassFreqs = { 'C3': 130.81, 'G2': 98.00, 'A2': 110.00, 'E2': 82.41 };
    
    bassNotes.forEach((note, index) => {
      const oscillator = this.audioContext.createOscillator();
      const noteGain = this.audioContext.createGain();
      
      oscillator.connect(noteGain);
      noteGain.connect(this.musicGainNode);
      
      oscillator.frequency.value = bassFreqs[note];
      oscillator.type = 'triangle';
      
      const startTime = currentTime + (index * 0.72);
      
      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
      noteGain.gain.linearRampToValueAtTime(0, startTime + 0.65);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.7);
      
      this.musicNodes.push(oscillator);
    });
    
    // Loop the music
    const loopDuration = notes.length * 0.18;
    setTimeout(() => {
      if (this.musicPlaying && this.isPlaying) {
        this.playMusicLoop();
      }
    }, loopDuration * 1000);
  }
  
  stopBackgroundMusic() {
    this.musicPlaying = false;
    
    // Stop all music oscillators
    this.musicNodes.forEach(node => {
      try {
        node.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this.musicNodes = [];
  }
  
  playSound(type) {
    if (!this.soundEnabled || !this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.effectsGainNode);
    
    switch(type) {
      case 'move':
        oscillator.frequency.value = 500;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.15;
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.05);
        break;
        
      case 'land':
        oscillator.frequency.value = 150;
        oscillator.type = 'triangle';
        gainNode.gain.value = 0.2;
        oscillator.start();
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.15);
        oscillator.stop(this.audioContext.currentTime + 0.15);
        break;
        
      case 'combine':
        // Magical combining sound
        oscillator.frequency.value = 400;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.25;
        oscillator.start();
        oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
        oscillator.stop(this.audioContext.currentTime + 0.3);
        break;
        
      case 'levelup':
        oscillator.frequency.value = 523;
        oscillator.type = 'square';
        gainNode.gain.value = 0.2;
        oscillator.start();
        oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.15);
        oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.3);
        oscillator.frequency.setValueAtTime(1047, this.audioContext.currentTime + 0.45);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.6);
        oscillator.stop(this.audioContext.currentTime + 0.6);
        break;
        
      case 'spawn':
        oscillator.frequency.value = 350;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.frequency.linearRampToValueAtTime(450, this.audioContext.currentTime + 0.08);
        oscillator.stop(this.audioContext.currentTime + 0.08);
        break;
        
      case 'gameover':
        oscillator.frequency.value = 400;
        oscillator.type = 'sawtooth';
        gainNode.gain.value = 0.15;
        oscillator.start();
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.8);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.8);
        oscillator.stop(this.audioContext.currentTime + 0.8);
        break;
    }
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.game = new NumberBlocksGame();
});

// Handle visibility change
document.addEventListener('visibilitychange', () => {
  if (window.game) {
    if (document.hidden) {
      window.game.isPaused = true;
      window.game.stopBackgroundMusic();
    } else if (window.game.isPlaying) {
      window.game.isPaused = false;
      window.game.startBackgroundMusic();
    }
  }
});
