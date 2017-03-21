---
title: Friends
slug: friends
date: 2016-04-19
---

I love my friends!

{% for key, friend in site.data.friends %}
  <p>Name: {{friend.name}}</p>
  <p>Birthday: {{friend.birthday}}</p>
{% endfor %}
