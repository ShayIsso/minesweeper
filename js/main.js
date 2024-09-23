'use strict'

const EMPTY = ' '
const MINE = '💣'
const FLAG = '🚩'


var gBoard
var gTimerIntrval
var gStartTime

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
}

function onInit() {
    gBoard = buildBoard()
    renderBoard(gBoard)

    resetGame()
    resetDisplay()
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
                mineClicked: false,
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

    if (gGame.shownCount === 0) {
        startGame(i, j)
    }

    if (cell.isMarked || cell.isShown || !gGame.isOn) return
    

    if (cell.isMine) {
        gLevel.MINES--
        cell.isShown = true
        updateShownCount()

        gGame.livesLeft--
        updateLives()
        console.log('livesLeft', gGame.livesLeft)

        elCell.innerHTML = MINE
        elCell.classList.add('mine')
        checkGameOver()
        return
    } else if (cell.minesAroundCount === 0) {
        expandShow(gBoard, elCell, i, j)
        checkGameOver()
        return

    }
    // Update Model
    cell.isShown = true
    updateShownCount()

    checkGameOver()

    // Update DOM
    elCell.classList.add('selected')
    elCell.innerHTML = cell.minesAroundCount || EMPTY
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

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            const cell = board[i][j]

            if (!cell.isMine) {
                cell.minesAroundCount = getNeighborsCount(board, i, j)
            }
        }
    }
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
    gGame.isOn = true
    startTimer()
    addMines(firstClickedI, firstClickedJ)
    setMinesNegsCount(gBoard)
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

    resetDisplay()
}

function expandShow(board, elCell, i, j) {
    for (var rowIdx = i - 1; rowIdx <= i + 1; rowIdx++) {
        if (rowIdx < 0 || rowIdx >= board.length) continue
        for (var colIdx = j - 1; colIdx <= j + 1; colIdx++){
            if (colIdx < 0 || colIdx >= board[i].length) continue

            const cell = board[rowIdx][colIdx]
            if (!cell.isShown && !cell.isMarked && !cell.isMine) {
                const currElCell = document.querySelector(`.cell-${rowIdx}-${colIdx}`) 
                //Update Model
                cell.isShown = true
                updateShownCount()

                //Update DOM
                currElCell.classList.add('selected')
                currElCell.innerHTML = cell.minesAroundCount || EMPTY

                if (cell.minesAroundCount === 0) {
                    expandShow(board, currElCell, rowIdx, colIdx)
                }
            }
        }
    }
}

// function showCell(cell, elCell){
//     cell.isShown = true
//     updateShownCount()
//     elCell.classList.add('selected')
//     elCell.innerHTML = cell.minesAroundCount || EMPTY
// }

// DISPLAY

function resetDisplay() {
    const elTimer = document.querySelector('.timer')
    const elShownCount = document.querySelector('.shown-count')
    const elMarkedCount = document.querySelector('.marked-count')
    const elSmiley = document.querySelector('.smiley')

    elShownCount.innerText = gGame.shownCount
    elMarkedCount.innerText = gGame.markedCount
    elSmiley.innerText = '😃'
    elTimer.innerText = '00'
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
    gTimerIntrval = setInterval(updateDisplay, 1000)
}

function updateShownCount() {
    gGame.shownCount++
    const elShownCount = document.querySelector('.shown-count')
    elShownCount.innerText = gGame.shownCount
}

function updateLives() {
    const elLivesleft = document.querySelector('.lives-left')
    var str = elLivesleft.innerText

    elLivesleft.innerText = str.replace('💚', '')
    console.log('UPDATEEE')
}