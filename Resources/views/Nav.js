function Nav(data, rect, path) {

	//Cria o ScrollView onde o Thumbnail será construido.
	var self = Ti.UI.createScrollView({
		backgroundImage : 'linen_texture_dark@2x.png',
		scrollType : 'horizontal',
		bottom : -160,
		width : '100%',
		height : 160
	});

	Ti.App.hideThumbnail = function() {
		self.animate({
			bottom : -160,
			duration : 500
		});
	}

	Ti.App.showThumbnail = function() {
		self.animate({
			bottom : 0,
			duration : 500
		});
	}
	//FIM BLOCO-------------------------------------------------------------------------------------------------------------------------------

	//Insere o thumbnail no ScrollView
	var w = rect.width;
	var thumbWidth = 160;
	var left = (w - thumbWidth) / 2;
	var right = (w - thumbWidth) / 2;
	var centro = (w - thumbWidth) / 2;
	for (var i = 0, count = data.length; i < count; i++) {
		if (i % 2 == 0)
			left = left - 20;

		var imgThumb = data[i].thumbnail;
		imgThumb = imgThumb.split("/");
		imgThumb.reverse();
		var pg = Ti.UI.createImageView({
			// image : path + '/' + data[i].thumbnail, //TODO: Foi modificado esta parte do aplicativo para dar um split no json.
			image : path + '/' + imgThumb[0],
			index : i,
			top : 10,
			bottom : 10,
			left : left,
			right : right,
			height : 'auto',
			width : 120,
		});

		left += thumbWidth - 35;

		//EventListener de click na página do Thumbnail: Clicke na página para mudar a página da revista.
		pg.addEventListener('singletap', function(e) {
			self.fireEvent('nav:thumbClick', {
				index : e.source.index
			});
		});

		pg.addEventListener('load', function(e) {
		});

		self.add(pg);
	}
	//FIM BLOCO-------------------------------------------------------------------------------------------------------------------------------

	//Função onde centraliza a imagem do Thumbnail com a imagem que está na tela da revista.
	self.goTo = function(index) {
		self.scrollTo((self.children[index].rect.x - centro), 10);
	};
	//FIM BLOCO-------------------------------------------------------------------------------------------------------------------------------

	//Funções Avaçar até o fim do Thumbnail e Retornar para o Início.
	Ti.App.nextFast = function() {
		self.scrollToBottom();
	};

	Ti.App.previousFast = function() {
		self.scrollTo(0, 0);
	};
	//FIM BLOCO-------------------------------------------------------------------------------------------------------------------------------

	return self;
}

//make constructor function the public component interface
module.exports = Nav; 