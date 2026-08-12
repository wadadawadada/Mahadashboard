from jyotish.engine.compatibility import calculate_compatibility


def _chart(
    moon_sign="Aries",
    moon_nakshatra="Ashwini",
    lagna_sign="Aries",
    venus_sign="Taurus",
    mars_sign="Gemini",
    mars_dignity="neutral",
):
    return {
        "lagna": {"sign": lagna_sign},
        "planets": {
            "moon": {"sign": moon_sign, "nakshatra": moon_nakshatra},
            "venus": {"sign": venus_sign, "nakshatra": "Bharani"},
            "mars": {"sign": mars_sign, "nakshatra": "Mrigashira", "dignity": mars_dignity},
        },
    }


def test_same_moon_star_keeps_nadi_as_critical_flag():
    result = calculate_compatibility(_chart(), _chart(), language="ru")

    assert result["score"]["points"] == 28
    assert result["score"]["max_points"] == 36
    assert any(item["traditional_key"] == "nadi" and item["score"] == 0 for item in result["kuta"])
    assert any(flag["level"] == "high" for flag in result["flags"])


def test_adjacent_compatible_moon_stars_score_high():
    chart_a = _chart(moon_sign="Aries", moon_nakshatra="Ashwini")
    chart_b = _chart(moon_sign="Aries", moon_nakshatra="Bharani")

    result = calculate_compatibility(chart_a, chart_b, language="ru")

    assert result["score"]["points"] >= 30
    assert result["score"]["adjusted_percent"] >= 80
    assert result["categories"]


def test_mangal_mismatch_adds_readable_warning_and_penalty():
    # Uses "own_sign" — the value get_dignity() actually emits — not the
    # synthetic "own" the engine never produces (S4.2 / FR12).
    chart_a = _chart(mars_sign="Aries", mars_dignity="own_sign")
    chart_b = _chart(mars_sign="Virgo")

    result = calculate_compatibility(chart_a, chart_b, language="ru")

    assert result["mangal"]["status"] == "mismatch"
    assert result["mangal"]["penalty"] == 10
    assert any("конфликт" in flag["text"].lower() for flag in result["flags"])


def test_own_sign_mars_mitigates_dosha():
    # Mars in its own sign (Scorpio) with exactly one Mangal house hit (1st from
    # lagna). With mitigation the single hit is cancelled (no dosha); without it
    # the dosha stands. Exercises the real emitted dignity value "own_sign" —
    # this assertion FAILS against the pre-fix {"own", ...} mitigation set.
    base = dict(
        lagna_sign="Scorpio",
        moon_sign="Virgo",
        moon_nakshatra="Hasta",
        venus_sign="Cancer",
        mars_sign="Scorpio",
    )
    mitigated = _chart(mars_dignity="own_sign", **base)
    not_mitigated = _chart(mars_dignity="neutral", **base)

    res_mit = calculate_compatibility(mitigated, mitigated, language="ru")
    res_unmit = calculate_compatibility(not_mitigated, not_mitigated, language="ru")

    assert res_mit["mangal"]["a"]["mitigated"] is True
    assert res_mit["mangal"]["a"]["has_dosha"] is False
    assert res_unmit["mangal"]["a"]["mitigated"] is False
    assert res_unmit["mangal"]["a"]["has_dosha"] is True


def test_context_changes_focus_and_percent_without_changing_base_points():
    chart_a = _chart(moon_sign="Aries", moon_nakshatra="Ashwini")
    chart_b = _chart(moon_sign="Libra", moon_nakshatra="Swati")

    romance = calculate_compatibility(chart_a, chart_b, language="ru", context="romance")
    business = calculate_compatibility(chart_a, chart_b, language="ru", context="business")

    assert romance["score"]["points"] == business["score"]["points"]
    assert romance["context_view"]["percent"] != business["context_view"]["percent"]
    assert romance["context_view"]["categories"][0]["id"] == "emotional"
    assert business["context_view"]["categories"][0]["id"] == "daily"


def test_long_term_stability_is_capped_when_critical_family_factor_fails():
    result = calculate_compatibility(_chart(), _chart(), language="ru")
    stability = next(item for item in result["categories"] if item["id"] == "stability")
    life_direction = next(item for item in result["kuta"] if item["traditional_key"] == "bhakoot")

    assert life_direction["label_ru"] == "Общий жизненный вектор"
    assert stability["label_ru"] == "Долгосрочная устойчивость"
    assert stability["percent"] <= 59


def test_life_direction_explains_two_twelve_pattern():
    chart_a = _chart(moon_sign="Aquarius", moon_nakshatra="Shatabhisha")
    chart_b = _chart(moon_sign="Pisces", moon_nakshatra="Revati")

    result = calculate_compatibility(chart_a, chart_b, language="ru")
    life_direction = next(item for item in result["kuta"] if item["traditional_key"] == "bhakoot")

    assert life_direction["score"] == 0
    assert "2/12" in life_direction["note_ru"]
