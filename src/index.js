import Vue from "vue";
import fullscreen from "vue-fullscreen";
import $ from "jquery";
import Board from "./board.js";


let isPlaying = false;
let shiftX = 10;
let shiftY = 10;

const minWidthCanvas = 1600;
let widthCanvas = 0;
let widthBoard = 0;

let heightBoard = 950;

let colors = {
    "text": "#000",
    "border": "#cccccc",
    "cardBorder": "#333333",
    "ready": "#b800dd",
    "analysis": "#ce1212",
    "development": "#1266cf",
    "testing": "#008100",
    "deployed": "#000000"
};

let config = {};
let board = {};
let tracing = [];

Vue.use(fullscreen);
let app = new Vue({
    el: "#app",
    data: {
        fullscreen: false,
        startButton: "▶️",
        resetButton: "🔄",
        fullscreenButton: "🎦",
        stages: {
            ready: {
                limit: 4,
                isInnerDone: false
            },
            analysis: {
                limit: 2,
                diceCount: 2,
                complexity: 2,
                isInnerDone: true
            },
            development: {
                limit: 4,
                diceCount: 3,
                complexity: 1,
                isInnerDone: true
            },
            testing: {
                limit: 3,
                diceCount: 2,
                complexity: 3,
                isInnerDone: false
            },
            done: {
                isInnerDone: false
            },
            deployed: {
                delay: 7,
                isInnerDone: false
            }
        }
    },
    methods: {
        construct: function () {
            tracing = [];
            config.stages = Object.keys(this.stages).map(key => {
                let stage = {};
                Object.assign(stage, this.stages[key]);
                stage.name = key;
                return stage;
            });
            board = new Board(config);
        },
        reset: function (event) {
            if (isPlaying) {
                this.startToggle();
            }
            this.construct();
            draw(this);
        },
        startToggle: function (event) {
            isPlaying = !isPlaying;
            this.startButton = isPlaying ? "⏸" : "▶️";
            draw();
        },
        fullscreenToggle: function (event) {
            this.fullscreen = !this.fullscreen
        },
        handleResize: function (event) {
            if (!isPlaying) {
                draw();
            }
        }
    },
    created() {
        window.addEventListener("resize", this.handleResize);
        this.handleResize();
        const e = this.$refs.board;
        console.log(e)
    },
    mounted() {
        this.construct();
        draw();
    },
    updated() {
        config.stages = Object.keys(this.stages).map(key => {
            let stage = {};
            Object.assign(stage, this.stages[key]);
            stage.name = key;
            return stage;
        });
        board.updatedConfig(config);
    },
    destroyed() {
        window.removeEventListener("resize", this.handleResize);
    }
});

function draw() {
    widthCanvas = Math.max(window.innerWidth * 0.99, minWidthCanvas);
    widthBoard = widthCanvas * 0.99;
    heightBoard = (minWidthCanvas / 1.68) + (widthCanvas - minWidthCanvas) * 0.2;
    $("canvas").attr("width", widthCanvas);
    $("canvas").attr("height", heightBoard);
    $(".singleCell").css("width", widthCanvas / 8);
    $(".doubleCell").css("width", widthCanvas / 4);
    $(".input_data").css("width", widthCanvas / 32);
    $(".input_data").css("font-size", parseInt(heightBoard / 50) + "px");

    let boardCanvas = document.getElementById("board");
    let cfdCanvas = document.getElementById("cfd");
    let ccCanvas = document.getElementById("cc");
    if (boardCanvas.getContext) {
        let data = isPlaying ? board.turn() : board.view();
        drawBoard(boardCanvas.getContext("2d"), data);
        drawCFD(cfdCanvas.getContext("2d"), data);
        drawCC(ccCanvas.getContext("2d"), data);

        if (isPlaying) {
            setTimeout(draw, 500);
        }

    }
}

function drawBoard(ctx, data) {
    ctx.clearRect(0, 0, widthBoard, heightBoard);

    let spec = {
        "laneWidth": widthBoard / 8,
        "laneHeight": heightBoard * 0.1,
        "columnLabelLevel": heightBoard * 0.03,
        "columnMinorLabelLevel": heightBoard * 0.06,
        "wipLabelLevel": heightBoard * 0.075,
        "wipLabelHeight": heightBoard * 0.05,
        "dashedLevel": heightBoard * 0.15,
        "dashedLabelLevel": heightBoard * 0.18,
        "expediteLaneLevel": heightBoard * 0.2,
        "standardLaneLevel": heightBoard * 0.3,
    };
    //Lanes
    ctx.lineWidth = 3;
    let radius = 25;

    rr(ctx, shiftX, shiftY, widthBoard + shiftX, heightBoard + shiftY, radius, colors.border, [1, 0]);
    rr(ctx, shiftX, spec.expediteLaneLevel + shiftY, widthBoard + shiftX, spec.standardLaneLevel + shiftY, 0, colors.border, [1, 0]);


    ln(ctx, shiftX, shiftY + radius, shiftX, heightBoard - radius + shiftY, colors.ready, [1, 0]);
    rr(ctx, spec.laneWidth * 0.25 + shiftX, spec.wipLabelLevel + shiftY, spec.laneWidth * 0.75 + shiftX, spec.wipLabelLevel + spec.wipLabelHeight + shiftY, 5, colors.ready, [1, 0]);

    ln(ctx, spec.laneWidth + shiftX, shiftY, spec.laneWidth + shiftX, heightBoard + shiftY, colors.border, [1, 0]);

    ln(ctx, spec.laneWidth * 2 + shiftX, spec.dashedLevel + shiftY, spec.laneWidth * 2 + shiftX, heightBoard + shiftY, colors.analysis, [1, 0]);
    ln(ctx, spec.laneWidth + shiftX, spec.dashedLevel + shiftY, spec.laneWidth * 3 + shiftX, spec.dashedLevel + shiftY, colors.analysis, [20, 5]);
    rr(ctx, spec.laneWidth * 1.75 + shiftX, spec.wipLabelLevel + shiftY, spec.laneWidth * 2.25 + shiftX, spec.wipLabelLevel + spec.wipLabelHeight + shiftY, 5, colors.analysis, [1, 0]);

    ln(ctx, spec.laneWidth * 3 + shiftX, shiftY, spec.laneWidth * 3 + shiftX, heightBoard + shiftY, colors.border, [1, 0]);

    ln(ctx, spec.laneWidth * 4 + shiftX, spec.dashedLevel + shiftY, spec.laneWidth * 4 + shiftX, heightBoard + shiftY, colors.development, [1, 0]);
    ln(ctx, spec.laneWidth * 3 + shiftX, spec.dashedLevel + shiftY, spec.laneWidth * 5 + shiftX, spec.dashedLevel + shiftY, colors.development, [20, 5]);
    rr(ctx, spec.laneWidth * 3.75 + shiftX, spec.wipLabelLevel + shiftY, spec.laneWidth * 4.25 + shiftX, spec.wipLabelLevel + spec.wipLabelHeight + shiftY, 5, colors.development, [1, 0]);

    ln(ctx, spec.laneWidth * 5 + shiftX, shiftY, spec.laneWidth * 5 + shiftX, heightBoard + shiftY, colors.border, [1, 0]);

    ln(ctx, spec.laneWidth * 6 + shiftX, shiftY, spec.laneWidth * 6 + shiftX, heightBoard + shiftY, colors.testing, [1, 0]);
    rr(ctx, spec.laneWidth * 5.25 + shiftX, spec.wipLabelLevel + shiftY, spec.laneWidth * 5.75 + shiftX, spec.wipLabelLevel + spec.wipLabelHeight + shiftY, 5, colors.testing, [1, 0]);

    ln(ctx, spec.laneWidth * 7 + shiftX, shiftY, spec.laneWidth * 7 + shiftX, heightBoard + shiftY, colors.deployed, [1, 0]);


    //Labels
    columnLabel(ctx, spec.laneWidth * 0.25 + shiftX, shiftY + spec.columnLabelLevel, colors.ready, "Ready");
    minorLabel(ctx, spec.laneWidth * 0.28 + shiftX, shiftY + spec.columnMinorLabelLevel, colors.ready, "WIP Limit");
    columnLabel(ctx, spec.laneWidth * 1.65 + shiftX, shiftY + spec.columnLabelLevel, colors.analysis, "Analysis, " + config.stages.filter(stage => stage.name === "analysis")[0].diceCount);
    minorLabel(ctx, spec.laneWidth * 1.78 + shiftX, shiftY + spec.columnMinorLabelLevel, colors.analysis, "WIP Limit");
    columnLabel(ctx, spec.laneWidth * 3.50 + shiftX, shiftY + spec.columnLabelLevel, colors.development, "Development, " + config.stages.filter(stage => stage.name === "development")[0].diceCount);
    minorLabel(ctx, spec.laneWidth * 3.78 + shiftX, shiftY + spec.columnMinorLabelLevel, colors.development, "WIP Limit");
    columnLabel(ctx, spec.laneWidth * 5.15 + shiftX, shiftY + spec.columnLabelLevel, colors.testing, "Testing, " + config.stages.filter(stage => stage.name === "testing")[0].diceCount);
    minorLabel(ctx, spec.laneWidth * 5.28 + shiftX, shiftY + spec.columnMinorLabelLevel, colors.testing, "WIP Limit");
    columnLabel(ctx, spec.laneWidth * 6.25 + shiftX, shiftY + spec.columnLabelLevel, colors.text, "Done");
    columnLabel(ctx, spec.laneWidth * 7.25 + shiftX, shiftY + spec.columnLabelLevel, colors.text, "Deployed");

    //Minor labels
    minorLabel(ctx, spec.laneWidth * 1.25 + shiftX, spec.dashedLabelLevel + shiftY, colors.analysis, "In Progress");
    minorLabel(ctx, spec.laneWidth * 2.40 + shiftX, spec.dashedLabelLevel + shiftY, colors.analysis, "Done");
    minorLabel(ctx, spec.laneWidth * 3.25 + shiftX, spec.dashedLabelLevel + shiftY, colors.development, "In Progress");
    minorLabel(ctx, spec.laneWidth * 4.40 + shiftX, spec.dashedLabelLevel + shiftY, colors.development, "Done");


    //Limits
    wipLimitLabel(ctx, spec.laneWidth * 0.40 + shiftX, spec.wipLabelLevel + spec.wipLabelHeight, config.stages.filter(stage => stage.name === "ready")[0].limit);
    wipLimitLabel(ctx, spec.laneWidth * 1.90 + shiftX, spec.wipLabelLevel + spec.wipLabelHeight, config.stages.filter(stage => stage.name === "analysis")[0].limit);
    wipLimitLabel(ctx, spec.laneWidth * 3.90 + shiftX, spec.wipLabelLevel + spec.wipLabelHeight, config.stages.filter(stage => stage.name === "development")[0].limit);
    wipLimitLabel(ctx, spec.laneWidth * 5.45 + shiftX, spec.wipLabelLevel + spec.wipLabelHeight, config.stages.filter(stage => stage.name === "testing")[0].limit);

    //dices


    let allCards = [
        data.columns.ready.wip,
        data.columns.analysis.wip,
        data.columns.analysis.done,
        data.columns.development.wip,
        data.columns.development.done,
        data.columns.testing.wip,
        data.columns.done.wip,
        data.columns.deployed.wip.slice(data.columns.deployed.wip.length - 6, data.columns.deployed.wip.length),
    ];
    for (let i = 0; i < allCards.length; i++) {
        for (let j = 0; j < allCards[i].length; j++) {
            drawCard(ctx, spec.laneWidth, spec.laneHeight, spec.standardLaneLevel, i, j, allCards[i][j])
        }
    }
}

function drawCard(ctx, laneWidth, laneHeight, laneLevel, i, j, card) {
    let padding = 10;
    rr(ctx, laneWidth * i + padding + shiftX, laneLevel + laneHeight * j + padding + shiftY, laneWidth * (i + 1) - padding + shiftX, laneLevel + laneHeight * (j + 1) + shiftY,
        5, colors.cardBorder, [1, 0]);

    ctx.font = parseInt(heightBoard / 50) + "px Arial";
    ctx.fillStyle = colors.text;
    ctx.fillText(card.cardId, laneWidth * i + padding + shiftX + 5, laneLevel + laneHeight * j + padding + shiftY + 20);

    ca(ctx, laneWidth * i + padding + shiftX + 10, laneLevel + laneHeight * j + padding + shiftY + 2 * heightBoard / 55,
        heightBoard / 250, colors.analysis, card.estimations.analysis - card.remainings.analysis, card.estimations.analysis);
    ca(ctx, laneWidth * i + padding + shiftX + 10, laneLevel + laneHeight * j + padding + shiftY + 3 * heightBoard / 55,
        heightBoard / 250, colors.development, card.estimations.development - card.remainings.development, card.estimations.development);
    ca(ctx, laneWidth * i + padding + shiftX + 10, laneLevel + laneHeight * j + padding + shiftY + 4 * heightBoard / 55,
        heightBoard / 250, colors.testing, card.estimations.testing - card.remainings.testing, card.estimations.testing);
}

function minorLabel(ctx, x, y, color, value) {
    return drawLabel(ctx, x, y, parseInt(heightBoard / 50) + "px Arial", color, value);
}

function columnLabel(ctx, x, y, color, value) {
    return drawLabel(ctx, x, y, parseInt(heightBoard / 40) + "px Arial", color, value);
}

function wipLimitLabel(ctx, x, y, value) {
    return drawLabel(ctx, x, y, parseInt(heightBoard / 30) + "px Arial", colors.text, value);
}

function drawLabel(ctx, x, y, font, color, value) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
}

function drawCFD(ctx, data) {
    ctx.clearRect(0, 0, widthBoard, heightBoard);

    ctx.lineWidth = 1;
    rr(ctx, shiftX, shiftY, shiftX + widthBoard, shiftY + heightBoard, 25, colors.border, [1, 0]);
    let cellCount = tracing.length > 20 ? Math.max(tracing.length * 1.5, tracing[tracing.length - 1].ready * 1.5) : 50;
    let spec = {
        cellWidth: Math.floor(widthBoard / cellCount)
    };

    for (let i = 1; i < cellCount; i++) {
        ln(ctx, shiftX + spec.cellWidth * i, shiftY, shiftX + spec.cellWidth * i, shiftY + heightBoard, i % 5 === 0 ? "#000" : colors.border, [1, 0]);
        if (i < Math.floor(heightBoard / spec.cellWidth)) {
            ln(ctx, shiftX, shiftY + spec.cellWidth * i, shiftX + widthBoard, shiftY + spec.cellWidth * i, i % 5 === 0 ? "#000" : colors.border, [1, 0]);
        }
    }


    let currentTracing = {
        "deployed": data.columns.deployed.wip.length
    };
    currentTracing.testing = currentTracing.deployed + data.columns.done.wip.length;
    currentTracing.development = currentTracing.testing + data.columns.testing.wip.length + data.columns.development.done.length;
    currentTracing.analysis = currentTracing.development + data.columns.development.wip.length + data.columns.analysis.done.length;
    currentTracing.ready = currentTracing.analysis + data.columns.analysis.wip.length + data.columns.ready.wip.length;

    tracing.push(currentTracing);

    let lastPoint = {};
    tracing.forEach((count, i) => {
        Object.keys(count).forEach(key => {
            if (lastPoint[key] === undefined) {
                lastPoint[key] = {
                    x: shiftX,
                    y: heightBoard - shiftY
                };
            }
            ctx.lineWidth = 3;
            let point = {
                x: shiftX + i * spec.cellWidth,
                y: heightBoard - shiftY - spec.cellWidth * count[key]
            };
            ln(ctx, lastPoint[key].x, lastPoint[key].y, point.x, point.y, colors[key], [1, 0]);
            lastPoint[key] = point;
            ctx.beginPath();
            ctx.arc(lastPoint[key].x, lastPoint[key].y, 3, 0, 2 * Math.PI);
            ctx.strokeStyle = colors[key];
            ctx.stroke();
            ctx.fillStyle = colors[key];
            ctx.fill();
        });
    });
}

function drawCC(ctx, data) {
    ctx.clearRect(0, 0, widthBoard, heightBoard);

    ctx.lineWidth = 1;
    rr(ctx, shiftX, shiftY, shiftX + widthBoard, shiftY + heightBoard, 25, colors.border, [1, 0]);
    let cellCount = 50;
    let spec = {
        cellWidth: Math.floor(widthBoard / cellCount)
    };

    for (let i = 1; i < cellCount; i++) {
        ln(ctx, shiftX + spec.cellWidth * i, shiftY, shiftX + spec.cellWidth * i, shiftY + heightBoard, i % 5 === 0 ? "#000" : colors.border, [1, 0]);
        if (i < Math.floor(heightBoard / spec.cellWidth)) {
            ln(ctx, shiftX, shiftY + spec.cellWidth * i, shiftX + widthBoard, shiftY + spec.cellWidth * i, i % 5 === 0 ? "#000" : colors.border, [1, 0]);
        }
    }

    let cycleTimeMap = {};
    data.columns.deployed.wip.map(card => card.endDay - card.startDay).forEach(cycleTime => cycleTimeMap[cycleTime] = 1 + (cycleTimeMap[cycleTime] !== undefined ? cycleTimeMap[cycleTime] : 0));
    Object.keys(cycleTimeMap).forEach(key => {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.setLineDash([1, 0]);
        ctx.arc(shiftX + spec.cellWidth * key, shiftY + heightBoard - cycleTimeMap[key] * spec.cellWidth - 5 * spec.cellWidth, 3, 0, 2 * Math.PI);
        ctx.strokeStyle = colors.development;
        ctx.stroke();
        ctx.fillStyle = colors.development;
        ctx.fill();
        ln(ctx, shiftX + spec.cellWidth * key, shiftY + heightBoard - 5 * spec.cellWidth, shiftX + spec.cellWidth * key, shiftY + heightBoard - cycleTimeMap[key] * spec.cellWidth - 5 * spec.cellWidth, colors.development, [20, 5]);
    });

}

function ca(ctx, x, y, r, color, done, all) {
    ctx.lineWidth = 1;
    for (let i = 0; i < all; i++) {
        ctx.beginPath();
        ctx.arc(x + 3 * r * i, y, r, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.stroke();
        if (i < done) {
            ctx.fillStyle = color;
            ctx.fill();
        }
    }
}

function ln(ctx, x1, y1, x2, y2, color, dashed) {
    ctx.setLineDash(dashed);
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function rr(ctx, x1, y1, x2, y2, r, color, dashed) {
    ctx.setLineDash(dashed);
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1 + r, y1);
    ctx.lineTo(x2 - r, y1);
    ctx.arc(x2 - r, y1 + r, r, 1.5 * Math.PI, 0);
    ctx.lineTo(x2, y2 - r);
    ctx.arc(x2 - r, y2 - r, r, 0, 0.5 * Math.PI);
    ctx.lineTo(x1 + r, y2);
    ctx.arc(x1 + r, y2 - r, r, 0.5 * Math.PI, Math.PI);
    ctx.lineTo(x1, y1 + r);
    ctx.arc(x1 + r, y1 + r, r, Math.PI, 1.5 * Math.PI);
    ctx.stroke();
}
