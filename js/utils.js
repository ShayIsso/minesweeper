'use strict';

function getNeighbors(board, rowIdx, colIdx) {
    const neighbors = []

    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue

        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= board[i].length) continue
            if (i === rowIdx && j === colIdx) continue
            neighbors.push({cell: board[i][j], i: i, j: j})

        }
    }

    return neighbors
}

function forEachNeighbor(board, rowIdx, colIdx, func) {
    const neighbors = getNeighbors(board, rowIdx, colIdx)

    for (var i = 0; i < neighbors.length; i++) {
        const neighbor = neighbors[i]

        func(neighbor.cell, neighbor.i, neighbor.j)
    }
}

function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}