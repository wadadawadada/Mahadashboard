from jyotish.engine.aspects import get_aspect_houses


def test_sun_7th_aspect():
    houses = get_aspect_houses("sun", 1, False)
    assert 7 in houses


def test_moon_7th_aspect():
    houses = get_aspect_houses("moon", 3, False)
    assert 9 in houses  # 3 + 7 - 1 = 9


def test_mars_special_aspects():
    houses = get_aspect_houses("mars", 1, False)
    assert 4 in houses
    assert 7 in houses
    assert 8 in houses


def test_jupiter_special_aspects():
    houses = get_aspect_houses("jupiter", 1, False)
    assert 5 in houses
    assert 7 in houses
    assert 9 in houses


def test_saturn_special_aspects():
    houses = get_aspect_houses("saturn", 1, False)
    assert 3 in houses
    assert 7 in houses
    assert 10 in houses


def test_rahu_disabled_by_default():
    houses = get_aspect_houses("rahu", 1, False)
    assert houses == set()


def test_ketu_disabled_by_default():
    houses = get_aspect_houses("ketu", 1, False)
    assert houses == set()


def test_rahu_enabled():
    houses = get_aspect_houses("rahu", 1, True)
    assert 5 in houses
    assert 7 in houses
    assert 9 in houses


def test_mars_from_house_6():
    # Mars in house 6: 4th -> 9, 7th -> 12, 8th -> 1
    houses = get_aspect_houses("mars", 6, False)
    assert 9 in houses
    assert 12 in houses
    assert 1 in houses


def test_aspect_wrap_around():
    # Saturn in house 11: 3rd -> 1, 7th -> 5, 10th -> 8
    houses = get_aspect_houses("saturn", 11, False)
    assert 1 in houses
    assert 5 in houses
    assert 8 in houses
