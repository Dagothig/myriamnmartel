#!make
include .env
FAVICON_SIZES=32 128 152 167 180 192 196

build: html css

.PHONY: node
node:
	@yarn

.PHONY: data
data: node img favicons
	@node fetcher

.PHONY: html
html: node data clean-html
	@node node_modules/pug-cli -O data-fr.json src/ -b src/ -o public/
	@node node_modules/pug-cli -O data-en.json src/ -b src/ -o public/en

.PHONY: css
css: node clean-css
	@node node_modules/sass/sass.js src/:public/

images = $(wildcard public/img/*.png public/img/*.png)
thumbs = $(subst img,img-thumbs, $(images:.png=.png))
details = $(subst img,img-details, $(images:.png=.png))

.PHONY: unused
unused:
	@rm -f .current
	@find public/img-* -type f | sort > .current
	@rm -f .based
	@echo "$(thumbs) $(details)" | xargs | tr " " "\n" | sort > .based
	@comm -2 -3 .current .based | xargs -L1 rm -vf

.PHONY: img
img: unused $(thumbs) $(details)

public/img-thumbs/%.png: public/img/%.*
	@mkdir -p public/img-thumbs
	convert -quality 70 -resize 570 $< $@

public/img-details/%.png: public/img/%.*
	@mkdir -p public/img-details
	convert -quality 85 -resize 2000 $< $@

define GEN_FAVICON_RULE
favicons = $(favicons) public/favicon-$(size).png
public/favicon-$(size).png: src/favicon.svg
	convert -resize $(size)x$(size) $$< $$@
endef

$(foreach size, $(FAVICON_SIZES), \
	$(eval $(GEN_FAVICON_RULE)))

.PHONY: favicons
favicons: $(favicons)

.PHONY: serve
serve: build
	@(node node_modules/pug-cli -w -O data-en.json src/ -b src/ -o public/ &\
	  node node_modules/sass/sass.js src/:public/ &\
	  node server)

.PHONY: clean-html
clean-html:
	@echo "Removing html files from public"
	@rm -f public/*.html

.PHONY: clean-css
clean-css:
	@echo "Removing css files from public"
	@rm -f public/*.css

.PHONY: clean
clean: clean-html clean-css
	@echo "Removing thumb images from public"
	@rm -f public/img-thumbs/*
	@echo "Removing detail images from public"
	@rm -f public/img-details/*
	@echo "Removing data files"
	@rm -f data*.json
	@echo "Removing favicons"
	@rm -f public/favicon*
