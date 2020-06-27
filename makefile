#!make
include .env

build: html css img

.PHONY: node
node:
	@yarn

.PHONY: data
data: node
	@node fetcher

.PHONY: html
html: node data
	@node node_modules/pug-cli -O data-fr.json src/ -b src/ -o public/fr
	@node node_modules/pug-cli -O data-en.json src/ -b src/ -o public/

.PHONY: css
css: node
	@node_modules/node-sass/bin/node-sass src/ -o public/

images = $(wildcard public/img/*.png public/img/*.jpg)
thumbs = $(subst img,img-thumbs, $(images:.png=.jpg))

.PHONY: img
img: $(thumbs)

public/img-thumbs/%.jpg: public/img/%.*
	@mkdir -p public/img-thumbs
	convert -quality 70 -resize 570 $< $@

.PHONY: serve
serve: build
	@(node node_modules/pug-cli -w -O data-en.json src/ -b src/ -o public/ &\
	  node_modules/node-sass/bin/node-sass -w src/ -o public/ &\
	  node server)

.PHONY: clean
clean:
	@echo "Removing html files from public"
	@rm -f public/*.html
	@echo "Removing css files from public"
	@rm -f public/*.css
	@echo "Removing thumb images from public"
	@rm -f public/img-thumbs/*
	@echo "Removing data files"
	@rm -f data*.json

