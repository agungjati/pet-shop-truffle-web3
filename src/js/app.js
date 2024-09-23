App = {
  web3Provider: null,
  contracts: {},
  
  init: async function() {
    return await App.initWeb3();
  },
  
  initWeb3: async function() {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Minta akses akun.
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch (error) {
        console.error("User denied account access");
      }
    } else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },
  
  initContract: function() {
    $.getJSON('PetShop.json', function(data) {
      var PetShopArtifact = data;
      App.contracts.PetShop = TruffleContract(PetShopArtifact);
      App.contracts.PetShop.setProvider(App.web3Provider);
      
      return App.markAdopted();
    });

    $.getJSON('pets.json', function(data) {
      const pets = data;
      App.renderPets(pets);
    });
    
    return App.bindEvents();
  },
  
  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },
  
  markAdopted: function() {
    let petShopInstance;

    App.contracts.PetShop.deployed().then(function(instance) {
      petShopInstance = instance;
      return petShopInstance.getAdopters.call();
    }).then(function(adopters) {
      for (let i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    });
  },
  
  handleAdopt: function(event) {
    event.preventDefault();
    
    let petId = parseInt($(event.target).data('id'));

    let petShopInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      let account = accounts[0];

      App.contracts.PetShop.deployed().then(function(instance) {
        petShopInstance = instance;
        
        return petShopInstance.adopt(petId, { from: account });
      }).then(function(result) {
        return App.markAdopted();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  renderPets: function(pets) {
    const petsRow = $('#petsRow');
    const petTemplate = $('#petTemplate');
  
    pets.forEach((pet) => {
      petTemplate.find('.panel-title').text(pet.name);
      petTemplate.find('img').attr('src', pet.picture);
      petTemplate.find('.pet-breed').text(pet.breed);
      petTemplate.find('.pet-age').text(pet.age);
      petTemplate.find('.pet-location').text(pet.location);
      petTemplate.find('.btn-adopt').attr('data-id', pet.id);
  
      petsRow.append(petTemplate.html());
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
