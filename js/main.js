'use strict'

const EMPTY = ' '
const MINE = '💣'
const FLAG = '🚩'
const LIGHT_OFF_IMG = 'img/light-off.png'
const LIGHT_ON_IMG = 'img/light-on.png'

var gBoard
var gTimerIntrval
var gStartTime
var gMegaHintFirstCell
var gMoves = []

const gLevel = {
    SIZE: 4,
    MINES: 2,
}

const gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPass: 0,
    livesLeft: 3,
    hintLeft: 3,
    hintActive: false,
    megaHintUsed: false,
    megaHintActive: false,
}

function onInit() {
    clearInterval(gTimerIntrval)
    gTimerIntrval = null

    gBoard = buildBoard()
    renderBoard(gBoard)

    resetGame()
    renderBestScores()
    loadBestScores()
}

//BOARD
function setBoard(selectedSize) {
    gLevel.SIZE = selectedSize

    if (selectedSize === 4) {
        gLevel.MINES = 2
    } else if (selectedSize === 8) {
        gLevel.MINES = 14
    } else if (selectedSize === 12) {
        gLevel.MINES = 32
    }

    onInit()
}

function buildBoard() {
    const board = []

    for (var i = 0; i < gLevel.SIZE; i++) {
        board.push([])
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
            }
        }
    }

    return board
}

function renderBoard(board) {
    var strHTML = ''
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {
            const className = `cell cell-${i}-${j}`

            strHTML += `<td class="${className}" title="${i}-${j}"
                        onclick="onCellClick(this,${i},${j})" 
                        oncontextmenu="onCellMarked(this,${i},${j}); return false">
                        ${EMPTY} 
                        </td>`
        }
        strHTML += '</tr>'
    }
    const elContainer = document.querySelector('.board')
    elContainer.innerHTML = strHTML
}

function onCellClick(elCell, i, j) {
    console.log(`Clicked - i: ${i} j: ${j}`)
    const cell = gBoard[i][j]

    if (gGame.shownCount === 0 && gMoves.length === 0) {
        startGame(i, j)
    }

    if (cell.isMarked || cell.isShown || !gGame.isOn) return

    const move = { i, j, expandedCells: [], isMine: cell.isMine }

    if (gGame.megaHintActive) {
        showMegaHint(i, j)
        return
    }

    if (gGame.hintActive) {
        showHint(gBoard, elCell, i, j)
        return
    }

    if (cell.isMine) {
        handleMineClick(cell, elCell)
    } else {
        // Update Model
        cell.isShown = true
        updateShownCount(true)

        // Update DOM
        elCell.classList.add('selected')
        elCell.innerHTML = cell.minesAroundCount || EMPTY

        if (cell.minesAroundCount === 0) {
            expandShown(gBoard, i, j, move.expandedCells)
        }
    }

    gMoves.push(move)
    checkGameOver()
}


function onCellMarked(elCell, i, j) {
    console.log(`Right clicked - ${elCell}`)
    const cell = gBoard[i][j]

    if (cell.isShown || !gGame.isOn) return

    //Update Model
    gBoard[i][j].isMarked = !gBoard[i][j].isMarked
    gGame.markedCount += cell.isMarked ? 1 : -1

    checkGameOver()

    //Update DOM
    elCell.innerHTML = cell.isMarked ? FLAG : EMPTY

    const elMarkedCount = document.querySelector('.marked-count')
    elMarkedCount.innerText = gGame.markedCount

    console.log('markedCount:', gGame.markedCount)
}

//MINES
function handleMineClick(cell, elCell) {
    gLevel.MINES--
    cell.isShown = true
    updateShownCount(true)

    gGame.livesLeft--
    updateLives()
    console.log('livesLeft', gGame.livesLeft)

    elCell.innerHTML = MINE
    elCell.classList.add('mine')
    checkGameOver()
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            const cell = board[i][j]

            if (!cell.isMine) {
                cell.minesAroundCount = countMinesAroundCell(board, i, j)
            }
        }
    }
}

function countMinesAroundCell(board, rowIdx, colIdx) {
    var count = 0
    forEachNeighbor(board, rowIdx, colIdx, (neighborCell) => {
        if (neighborCell.isMine) {
            count++
        }
    })

    return count
}
function getEmptyCells() {
    const emptyCells = []

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            const cell = gBoard[i][j]

            if (!cell.isMine && !cell.isShown) {
                emptyCells.push({ i, j })
            }
        }
    }

    return emptyCells
}

function addMines(firstClickedI, firstClickedJ) {
    console.log('Add Mines!!')
    var emptyCells = getEmptyCells()
    if (!emptyCells.length) return

    for (var i = 0; i < gLevel.MINES; i++) {
        var ranCellIdx = getRandomInt(0, emptyCells.length)
        var ranCell = emptyCells[ranCellIdx]

        if (ranCell.i === firstClickedI && ranCell.j === firstClickedJ) {
            i--
            continue
        }

        gBoard[ranCell.i][ranCell.j].isMine = true
        console.log(`add mine at: ${ranCell.i}-${ranCell.j}`);


        emptyCells.splice(ranCellIdx, 1)
    }
}

function showMinesAndMarks() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            const cell = gBoard[i][j]
            const elCell = document.querySelector(`.cell-${i}-${j}`)
            if (cell.isMine && !cell.isMarked) {
                elCell.innerHTML = MINE
                elCell.classList.add('mine')
            } else if (!cell.isMine && cell.isMarked) {
                elCell.classList.add('highlighted')
            }
        }
    }
}

function checkAllMinesMarked() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            const cell = gBoard[i][j]
            if (cell.isMine && !cell.isMarked || !cell.isMine && cell.isMarked) {
                return false
            }
        }
    }
    return true
}


// GAME
function startGame(firstClickedI, firstClickedJ) {
    if (!gGame.isOn) {
        gGame.isOn = true
        startTimer()
        addMines(firstClickedI, firstClickedJ)
        setMinesNegsCount(gBoard)
    }
}

function checkGameOver() {
    const totalCells = gLevel.SIZE ** 2
    const allMinesMarked = checkAllMinesMarked()
    const cellsLeft = totalCells - gLevel.MINES

    const hasWin = gGame.shownCount === cellsLeft || allMinesMarked
    const hasLost = gGame.livesLeft === 0

    if (hasWin || hasLost) {
        gameOver(hasWin ? true : false)
    }
}

function gameOver(isWin) {
    clearInterval(gTimerIntrval)
    gGame.isOn = false

    if (isWin) {
        updateBestScores(gLevel.SIZE)
        renderBestScores()
        loadBestScores()
    }

    const elSmiley = document.querySelector('.smiley')

    var str = isWin ? '😎' : '🤯'
    elSmiley.innerText = str

    setTimeout(() => {
        showMinesAndMarks()
    }, 1000)
}

function resetGame() {
    gGame.isOn = false
    gGame.shownCount = 0
    gGame.markedCount = 0
    gGame.secsPass = 0
    gGame.livesLeft = 3
    gGame.hintLeft = 3

    gGame.hintActive = false
    gGame.megaHintActive = false
    gGame.megaHintUsed = false
    gMoves = []

    if (gLevel.SIZE === 4) gLevel.MINES = 2;
    else if (gLevel.SIZE === 8) gLevel.MINES = 14;
    else if (gLevel.SIZE === 12) gLevel.MINES = 32;

    resetDisplay()
}


function expandShown(board, i, j, expandedCells) {
    forEachNeighbor(board, i, j, (neighborCell, neighborI, neighborJ) => {
        if (neighborCell.isShown || neighborCell.isMarked || neighborCell.isMine) return

        const elNeighborCell = document.querySelector(`.cell-${neighborI}-${neighborJ}`)
        expandedCells.push({ i: neighborI, j: neighborJ, elCell: elNeighborCell })

        //Update Model
        neighborCell.isShown = true
        updateShownCount(true)

        //Update DOM
        elNeighborCell.classList.add('selected')
        elNeighborCell.innerHTML = neighborCell.minesAroundCount || EMPTY

        if (neighborCell.minesAroundCount === 0) {
            expandShown(board, neighborI, neighborJ, expandedCells)
        }

    })
}

//HINT
function onHintClick(elHint) {
    if (gGame.hintLeft <= 0 || !gGame.isOn) return

    gGame.hintActive = true
    gGame.hintLeft--

    elHint.src = LIGHT_ON_IMG
}


function showHint(board, elCell, i, j) {
    const cell = board[i][j]
    //Clicked cell
    showCellForHint(cell, elCell, 1000)

    forEachNeighbor(board, i, j, (nCell, neighborI, neighborJ) => {
        const elNeighbor = document.querySelector(`.cell-${neighborI}-${neighborJ}`)
        showCellForHint(nCell, elNeighbor, 1000)
    })

    setTimeout(() => {
        resetHint()
    }, 1000)
}

function showCellForHint(cell, elCell, timeToShow) {
    if (!cell.isShown && !cell.isMarked) {
        //Update Model
        cell.isShown = true


        //Update DOM
        elCell.classList.add('selected')
        elCell.innerHTML = cell.isMine ? MINE : (cell.minesAroundCount || EMPTY)

        setTimeout(() => {
            cell.isShown = false
            elCell.classList.remove('selected')
            elCell.innerHTML = EMPTY
        }, timeToShow)
    }
}

function resetHint() {
    gGame.hintActive = false

    const elHintImg = document.querySelector('.hint')
    elHintImg.src = LIGHT_OFF_IMG
}

// MEGA HINT
function onMegaHintClick() {
    if (!gGame.isOn || gGame.megaHintUsed) return

    //Update Model
    gGame.megaHintActive = true

    //Update DOM
    const elMegaHint = document.querySelector('.mega-hint')
    elMegaHint.classList.add('selected')
}

function showMegaHint(i, j) {
    if (!gMegaHintFirstCell) {
        gMegaHintFirstCell = { i, j }

        const elFirstCell = document.querySelector(`.cell-${gMegaHintFirstCell.i}-${gMegaHintFirstCell.j}`)
        elFirstCell.classList.add('selected')

    } else {
        showCellForMegaHint(gMegaHintFirstCell.i, gMegaHintFirstCell.j, i, j)
        resetMegaHint()
    }
}

function showCellForMegaHint(startI, startJ, endI, endJ) {
    for (var i = startI; i <= endI; i++) {
        for (var j = startJ; j <= endJ; j++) {
            const cell = gBoard[i][j]
            const elCell = document.querySelector(`.cell-${i}-${j}`)
            showCellForHint(cell, elCell, 2000)
        }
    }
}


function resetMegaHint() {
    gGame.megaHintActive = false
    gMegaHintFirstCell = null
    gGame.megaHintUsed = true

    const elMegaHint = document.querySelector('.mega-hint')
    elMegaHint.classList.remove('selected')
}

// UNDO 
function onUndoClick() {
    if (!gGame.isOn || gMoves.length === 0) return

    const lastMove = gMoves.pop()
    undoMove(lastMove)

    checkGameOver()
}

function undoMove(move) {
    const { i, j, expandedCells, isMine } = move
    const cell = gBoard[i][j]
    const elCell = document.querySelector(`.cell-${i}-${j}`)

    if (cell.isShown) {
        //Update Model
        cell.isShown = false
        updateShownCount(false)

        //Update DOM
        elCell.classList.remove('selected')
        elCell.innerHTML = EMPTY


        if (isMine) {
            //Update Model
            gLevel.MINES++

            //Update DOM
            elCell.classList.remove('mine')
        }
    }

    if (expandedCells && expandedCells.length > 0) {
        for (var idx = 0; idx < expandedCells.length; idx++) {
            const { i, j, elCell } = expandedCells[idx]
            const exCell = gBoard[i][j]
            //Update Model
            exCell.isShown = false
            updateShownCount(false)

            //Update DOM
            elCell.classList.remove('selected')
            elCell.innerHTML = EMPTY
            // }
        }
    }

    // console.log(`UNDO - i: ${i} j: ${j}`);
}

// LOCAL STORAGE
function loadBestScores() {
    const bestBeginnerScore = localStorage.getItem('bestBeginnerScore') || '0'
    const bestMediumScore = localStorage.getItem('bestMediumScore') || '0'
    const bestExpertScore = localStorage.getItem('bestExpertScore') || '0'

    document.querySelector('.best-beginner').innerText = bestBeginnerScore
    document.querySelector('.best-medium').innerText = bestMediumScore
    document.querySelector('.best-expert').innerText = bestExpertScore
}

function renderBestScores() {
    const strHTML = `
    <h2>Best Scores:</h2>
    <div class="best-scores-content">
        <span>Beginner: <span class="best-beginner">0</span></span>
        <span>Medium: <span class="best-medium">0</span></span>
        <span>Expert: <span class="best-expert">0</span></span>
    </div>
    `

    const elBestScores = document.querySelector('.best-scores')
    elBestScores.innerHTML = strHTML
}

function updateBestScores(levelSize) {
    console.log('updating best scores..')
    console.log('best scores', gGame.secsPass)
    var bestScoreKey

    if (levelSize === 4) bestScoreKey = 'bestBeginnerScore'
    else if (levelSize === 8) bestScoreKey = 'bestMediumScore'
    else if (levelSize === 12) bestScoreKey = 'bestExpertScore'

    const currentBestScore = +(localStorage.getItem(bestScoreKey)) || 0

    if (gGame.secsPass < currentBestScore || currentBestScore === 0) {
        localStorage.setItem(bestScoreKey, gGame.secsPass)
    }
}

// DISPLAY
function resetDisplay() {
    const elTimer = document.querySelector('.timer')
    const elShownCount = document.querySelector('.shown-count')
    const elMarkedCount = document.querySelector('.marked-count')
    const elSmiley = document.querySelector('.smiley')
    const elLivesleft = document.querySelector('.lives-left')

    elShownCount.innerText = gGame.shownCount
    elMarkedCount.innerText = gGame.markedCount
    elSmiley.innerText = '😃'
    elTimer.innerText = '00'
    elLivesleft.innerText = '💚💚💚'
}


function updateDisplay() {
    gGame.secsPass++
    const seconds = gGame.secsPass
    const formattedTime = `${seconds.toString().padStart(2, '0')}`

    const elTimer = document.querySelector('.timer')
    elTimer.innerText = formattedTime
}

function startTimer() {
    gStartTime = Date.now()
    if (!gTimerIntrval) {
        gTimerIntrval = setInterval(updateDisplay, 1000)
    }
}

function updateShownCount(increase) {
    increase ? gGame.shownCount++ : gGame.shownCount--

    const elShownCount = document.querySelector('.shown-count')
    elShownCount.innerText = gGame.shownCount
}

function updateLives() {
    const elLivesleft = document.querySelector('.lives-left')
    var str = elLivesleft.innerText

    elLivesleft.innerText = str.replace('💚', '')
}


// Dark Mode
function toggleDarkMode() {
    const elBody = document.body
    const elThemeIcon = document.querySelector('.theme-switch')

    elBody.classList.toggle('darkmode')

    if (elBody.classList.contains('darkmode')) {
        elThemeIcon.src = 'img/darkmode.png'
    } else {
        elThemeIcon.src = 'img/lightmode.png'
    }
}