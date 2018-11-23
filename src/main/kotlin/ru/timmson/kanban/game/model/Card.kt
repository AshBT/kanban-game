package ru.timmson.kanban.game.model

import com.fasterxml.jackson.annotation.JsonIgnore

data class Card(@JsonIgnore val id: Int, @JsonIgnore val cardType: String, @JsonIgnore val value: (Int) -> Int, @JsonIgnore val works: List<Work>) {

    companion object {
        @JvmField
        var CARD_TYPE_F = "F"

        @JvmField
        var CARD_TYPE_I = "I"

        @JvmField
        var CARD_TYPE_E = "E"

        @JvmField
        var CARD_TYPE_S = "S"

    }

    val cardId: String

    val estimations: MutableMap<Stage?, Int?>

    val remainings: MutableMap<Stage?, Int?>

    var startDay = 0

    var endDay = 0

    init {
        cardId = cardType + id.toString().padStart(3, '0')
        estimations = works.map { it.stage to it.points }.toMap().toMutableMap()
        remainings = estimations.toMutableMap()

    }

    fun getEstimation(stage: Stage): Int? {
        return estimations[stage]
    }

    fun getRemaining(stage: Stage): Int? {
        return remainings[stage]
    }

    fun decreaseRemaining(stage: Stage, points: Int?): Int? {
        val remainPoints: Int?
        if (points!! >= remainings[stage]!!) {
            remainPoints = points - remainings[stage]!!
            remainings[stage] = 0
        } else {
            remainPoints = 0
            remainings[stage] = remainings[stage]!! - points!!
        }
        return remainPoints
    }

    fun getCycleTime(): Int {
        return endDay - startDay
    }

    @Throws(CardNotFinishedException::class)
    fun calculateValue(): Int {
        return value.invoke(getCycleTime()!!)
    }

    override fun toString(): String {
        return "Card{" +
                "cardId='" + cardId + '\''.toString() +
                ", estimations=" + estimations +
                '}'.toString()
    }

}