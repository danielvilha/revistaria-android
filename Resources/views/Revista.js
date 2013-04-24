function Revista(_data) {
	//Require das funções do indice, página e variável global.
	var Page = require('ViewPageLoop');
	var Nav = require('Nav');
	//FIM BLOCO-------------------------------------------------------------------------------------------------------------------------------

	//Create da Window self.
	var self = Ti.UI.createWindow({
		backgroundColor : '#000',
		width : 'auto',
		fullscreen : true,
		navBarHidden : true
	});

	self.postlayout = false;
	self.orientationModes = [Titanium.UI.PORTRAIT];

	self.addEventListener('postlayout', function(e) {
		if (!self.postlayout) {
			self.postlayout = true;
			self.init();
		}
	});
	//FIM BLOCO-------------------------------------------------------------------------------------------------------------------------------
	self.init = function() {
		var currentPage;
		var data = [];
		var path = "";

		// var dir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, _data.id + Ti.Filesystem.separator + "files");
		var dir = Ti.Filesystem.getFile(Ti.Filesystem.externalStorageDirectory, _data.id + Ti.Filesystem.separator + "files");
		
		// path = Ti.Filesystem.applicationDataDirectory + _data.id + Ti.Filesystem.separator + "files";
		path = Ti.Filesystem.externalStorageDirectory + _data.id + Ti.Filesystem.separator + "files";
		// path = dir.resolve();
		var file = Titanium.Filesystem.getFile(path, "edicao.json");
		//Arquivo onde contém as propriedades da Revista----------------------------

		if (file.exists()) {
			var json = file.read();
			var d = JSON.parse(json);
			json = null;
			
			var order = function(pag_a, pag_b) {return pag_a.numero_pag - pag_b.numero_pag;};
			
			data = d.paginas;
			
			data.sort(order);
			// data.sort(function(pag_a, pag_b) {return pag_a.numero_pag - pag_b.numero_pag});
			
			Ti.API.info(data);
			
			var imgApp = data[0].imagem_app;
			imgApp = imgApp.split("/");
			imgApp.reverse();
			var img = Ti.UI.createImageView({
				// image : path + '/' + data[0].imagem_app, //TODO: Foi modificado esta parte do aplicativo para dar um split no json.
				image : path + '/' + imgApp[0],
				width : 'auto',
				height : 'auto'
			});
			Ti.App.image = img.toImage();

		} else {
			Ti.API.info("Arquivo Faltando.");
		}
		dir = null;
		file = null;

		var pages = [];

		for (var i = 0, count = data.length; i < count; i++) {
			data[i].index = i;
			var page = new Page(data[i], path);

			page.addEventListener('page:swipe', function(e) {
				if (e.direction == 'right') {
					scrollableView.moveNext();
				} else if (e.direction == 'left') {
					scrollableView.movePrevious();
				}
			});

			page.addEventListener('page:canScroll', function(e) {
				scrollableView.scrollingEnabled = e.scroll;
			});

			page.addEventListener('page:linkPage', function(e) {
				scrollableView.scrollToView(parseInt(e.value));
			});

			var visible = true;
			page.addEventListener('page:singletap', function(e) {
				if (visible === false) {
					visible = true;
					hideButtons();
					Ti.App.hideThumbnail();
				} else {
					visible = false;
					showButtons();
					Ti.App.showThumbnail();
				}
			});

			pages.push(page);
		}

		//----------------------------------------------------------------------------------------------------------------------------------------//
		//                                                                                                                                        //
		//**************************************************BLOCO DE CÓDIGOS DO SCROLL************************************************************//
		//                                                                                                                                        //
		//----------------------------------------------------------------------------------------------------------------------------------------//
		var scrollableView = Ti.UI.createScrollableView({
			width : "auto",
			height : "auto",
			scrollingEnabled : true
		});

		scrollableView.views = pages;

		var nav = new Nav(data, self.rect, path);

		scrollableView.addEventListener('scrollEnd', function(e) {
			scrollableView.scrollingEnabled = e.view.canScroll;
			var i = e.currentPage;
			currentPage = scrollableView.views[i];

			for (var v = 0; v < scrollableView.views.length; v++) {
				if (v != i) {
					var p = scrollableView.views[v];
					if (!p.canScroll)
						p.fitPage();
				}
			}

			nav.goTo(i);
		});

		self.loop = -1;
		self.closed = false;
		self.initialized = false;

		scrollableView.addEventListener('postlayout', function(e) {
			if (self.initialized)
				return;
			pageUpdate();
			currentPage = scrollableView.views[0];

			self.initialized = true;
		});

		function pageUpdate() {
			if (!self.closed) {
				self.loop = setTimeout(pageUpdate, 50);
			} else {
				clearTimeout(self.loop);
			}

			if (currentPage == null)
				return;
			try {
				currentPage.update();
			} catch(err) {
			}
		}

		function lag(e) {
			scrollableView.scrollingEnabled = e;
		}


		nav.addEventListener('nav:thumbClick', function(e) {
			scrollableView.scrollToView(e.index);
		});

		self.fechar = function() {
			clearTimeout(self.loop);
			self.loop = null;
			self.closed = true;
			for (var v = 0; v < pages.length; v++) {
				pages[v] = null;
			}

			self.remove(scrollableView);
			self.remove(nav);
			scrollableView = null;
			nav = null;
			pages = [];
			pages = null;
			currentPage = null;
			data = null;
		}

		self.add(scrollableView);

		self.add(nav);
		//FIM BLOCO-------------------------------------------------------------------------------------------------------------------------------

		//----------------------------------------------------------------------------------------------------------------------------------------//
		//                                                                                                                                        //
		//**************************************************BLOCO DE CÓDIGOS DOS BOTÕES***********************************************************//
		//                                                                                                                                        //
		//----------------------------------------------------------------------------------------------------------------------------------------//
		var nextFastButton = Ti.UI.createButton({
			backgroundImage : 'nextFastButton.png',
			backgroundSelectedImage : 'nextFastButtonClick.png',
			width : '8%',
			height : '10%',
			bottom : -1,
			right : -55, //Tamanho deve ser igual a Largura (width)
			zIndex : 9
		});

		nextFastButton.addEventListener('click', function() {
			Ti.App.nextFast();
		});

		self.add(nextFastButton);

		//Botão voltar ao inicio do THUMBNAIL
		var previousFastButton = Ti.UI.createButton({
			backgroundImage : 'previousFastButton.png',
			backgroundSelectedImage : 'previousFastButtonClick.png',
			width : '8%',
			height : '10%',
			bottom : -1,
			left : -55, //Tamanho deve ser igual a Largura (width)
			zIndex : 9
		});

		previousFastButton.addEventListener('click', function() {
			Ti.App.previousFast();
		});

		self.add(previousFastButton);

		//Botão voltar uma página
		var previousButton = Ti.UI.createButton({
			backgroundImage : 'previousButton.png',
			backgroundSelectedImage : 'previousButtonClick.png',
			width : '8%',
			height : '10%',
			bottom : '9%',
			left : -55, //Tamanho deve ser igual a Largura (width)
			zIndex : 9
		});
		previousButton.addEventListener('click', function() {
			scrollableView.movePrevious();
		});

		self.add(previousButton);
		//-----------------------------------

		//Botão avança uma página
		var nextButton = Ti.UI.createButton({
			backgroundImage : 'nextButton.png',
			backgroundSelectedImage : 'nextButtonClick.png',
			width : '8%',
			height : '10%',
			bottom : '9%',
			right : -55, //Tamanho deve ser igual a Largura (width)
			zIndex : 9
		});
		nextButton.addEventListener('click', function() {

			scrollableView.moveNext();
		});

		self.add(nextButton);

		function hideButtons() {
			nextFastButton.animate({
				right : -55,
				duration : 500
			});
			previousFastButton.animate({
				left : -55,
				duration : 500
			});
			nextButton.animate({
				right : -55,
				duration : 500
			});
			previousButton.animate({
				left : -55,
				duration : 500
			});
		}

		function showButtons() {
			nextFastButton.animate({
				right : 0,
				duration : 500
			});
			previousFastButton.animate({
				left : 0,
				duration : 500
			});
			nextButton.animate({
				right : 0,
				duration : 500
			});
			previousButton.animate({
				left : 0,
				duration : 500
			});
		}

	};

	return self;
}

//make constructor function the public component interface
module.exports = Revista;
