from jyotish.engine.nakshatra import NAKSHATRA_SPAN, get_nakshatra, get_pada


def test_ashwini_pada1():
    assert get_nakshatra(0.0) == "Ashwini"
    assert get_pada(0.0) == 1


def test_bharani_pada1():
    lon = NAKSHATRA_SPAN  # exactly 13.333...°
    assert get_nakshatra(lon) == "Bharani"
    assert get_pada(lon) == 1


def test_krittika_pada1():
    lon = 2 * NAKSHATRA_SPAN
    assert get_nakshatra(lon) == "Krittika"
    assert get_pada(lon) == 1


def test_pada_2():
    from jyotish.engine.nakshatra import PADA_SPAN
    lon = PADA_SPAN  # 3.333...° -> Ashwini pada 2
    assert get_nakshatra(lon) == "Ashwini"
    assert get_pada(lon) == 2


def test_last_nakshatra():
    lon = 26 * NAKSHATRA_SPAN
    assert get_nakshatra(lon) == "Revati"


def test_wrap_at_360():
    assert get_nakshatra(360.0) == "Ashwini"
    assert get_pada(360.0) == 1


def test_pada_clamp():
    # Just before next nakshatra boundary should still be pada 4
    lon = NAKSHATRA_SPAN - 0.0001
    assert get_pada(lon) == 4
