# 🧱 NumberBlocks Game

🚀 **[Live Demo](https://kylemath.github.io/NumberBlocks)** 🚀

A fun, toddler-friendly Tetris-style game featuring the beloved NumberBlocks characters! Watch as number friends fall from the sky and combine to make bigger numbers!

## 🎮 How to Play

1. **Open the game**: Just open `index.html` in your web browser
2. **Tap PLAY** to start the game
3. Use the **big colorful buttons** to move blocks left and right:
   - 🔴 **Pink Button (◀)** - Move LEFT
   - 🔵 **Blue Button (▶)** - Move RIGHT
4. When blocks touch, they **combine** to make bigger numbers!
   - 1 + 1 = 2! 🎉
   - 2 + 3 = 5! ⭐
   - 5 + 5 = 10! 🏆

## 👨‍👩‍👧 For Parents

- **Exit Button (✕)**: Small button in the top-right corner to exit the game
- **Fullscreen (⛶)**: Enter fullscreen mode for distraction-free play
- **Sound Toggle (🔊)**: Mute/unmute game sounds
- Game automatically pauses when you switch tabs

## 🎯 Features

- ✨ Beautiful, colorful SVG characters for all 10 NumberBlocks
- 🎵 Fun sound effects when blocks combine
- 🏆 5 progressive difficulty levels
- 📱 Touch-friendly controls perfect for tablets
- 🌟 Celebration animations when numbers combine
- 👶 Designed for 2+ year olds with simple two-button controls

## 📁 Project Structure

```
NumberBlocks/
├── index.html          # Main game file
├── css/
│   └── style.css       # All styling
├── js/
│   └── game.js         # Game logic
├── sprites/            # Character SVG images
│   ├── one.svg
│   ├── two.svg
│   ├── three.svg
│   ├── four.svg
│   ├── five.svg
│   ├── six.svg
│   ├── seven.svg
│   ├── eight.svg
│   ├── nine.svg
│   └── ten.svg
├── levels/
│   └── levels.json     # Level configuration & combos
├── sounds/             # (for future sound files)
└── images/
    └── image.png       # Reference image
```

## 🚀 Running the Game

### Option 1: Direct File Open
Simply double-click `index.html` to open in your default browser.

### Option 2: Local Server (Recommended)
For best results, run a local server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## 🎨 Characters

| Number | Name | Color | Special Feature |
|--------|------|-------|-----------------|
| 1 | One | Red | Single eye, antenna |
| 2 | Two | Orange | Glasses |
| 3 | Three | Yellow | Red buttons |
| 4 | Four | Green | Square shape (2×2) |
| 5 | Five | Blue | Star on chest |
| 6 | Six | Purple | Dice dots |
| 7 | Seven | Rainbow | Colorful blocks |
| 8 | Eight | Pink | Octopus tentacles |
| 9 | Nine | Gray | Pilot cap |
| 10 | Ten | White/Red | Stars everywhere! |

## 📜 License

Made with ❤️ for little learners!

NumberBlocks characters are inspired by the BBC/CBeebies show. This is a fan-made educational game.
