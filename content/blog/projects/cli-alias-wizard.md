---
date: 2025-04-05T16:14:06-04:00
modified: 2025-04-05T16:17:15-04:00
---

Have you ever found yourself typing the same loooong command over and over? So did I. After the 500th time typing `git checkout -b feature/something-with-a-ridiculous-name`, I finally snapped and built cli-alias-wizard.

It provides an easy [CLI](https://en.wikipedia.org/wiki/Command-line_interface) to add and edit the aliases in your `.zshrc` file. Sure- you could just edit it with vim- but I wanted a little wizard that would auto-refresh my shell afterward and make sure I didn't mess it up.

![](http://res.cloudinary.com/ejf/image/upload/v1743884050/Screenshot_2025-04-05_at_4.13.53_PM.png)