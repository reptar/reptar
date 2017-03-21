---
title: Cities
slug: cities
date: 2016-02-11
---

Cities I want to go to:

{% for city in site.data.cities %}
  <p>Name: {{city.name}}</p>
  <p>Birthday: {{city.cuisine}}</p>
{% endfor %}
