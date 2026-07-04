/*
  Moonshine Partner Command Center
  Batch 08 — Resource Store

  Local favorites and training progress.
*/

(function initResourceStore(window) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};
  window.MoonshineOS.dashboard = window.MoonshineOS.dashboard || {};

  var dashboard = window.MoonshineOS.dashboard;
  var storage = window.MoonshineOS.storage;
  var config = dashboard.config || {};

  var resourceFavoritesKey = config.storageKeys && config.storageKeys.resourceFavorites || "resourceFavorites";
  var marketplaceFavoritesKey = config.storageKeys && config.storageKeys.marketplaceFavorites || "marketplaceFavorites";
  var trainingProgressKey = config.storageKeys && config.storageKeys.trainingProgress || "trainingProgress";

  function getResources() {
    return dashboard.seedData && dashboard.seedData.resources || [];
  }

  function getMarketplaceOffers() {
    return dashboard.seedData && dashboard.seedData.marketplaceOffers || [];
  }

  function getTrainingModules() {
    return dashboard.seedData && dashboard.seedData.trainingModules || [];
  }

  function getList(key) {
    var list = storage && storage.get ? storage.get(key, []) : [];
    return Array.isArray(list) ? list : [];
  }

  function setList(key, list) {
    var value = Array.isArray(list) ? list : [];

    if (storage && storage.set) {
      storage.set(key, value);
    }

    if (dashboard.state) {
      var patch = {};
      if (key === resourceFavoritesKey) patch.resourceFavorites = value;
      if (key === marketplaceFavoritesKey) patch.marketplaceFavorites = value;
      dashboard.state.setState(patch, {
        type: "resource.setList",
        key: key
      });
    }

    return value;
  }

  function toggleInList(key, id) {
    var list = getList(key);
    var exists = list.indexOf(id) >= 0;

    list = exists
      ? list.filter(function remove(item) { return item !== id; })
      : list.concat(id);

    setList(key, list);

    return {
      id: id,
      active: !exists,
      list: list
    };
  }

  function getResourceFavorites() {
    return getList(resourceFavoritesKey);
  }

  function toggleResourceFavorite(id) {
    return toggleInList(resourceFavoritesKey, id);
  }

  function getMarketplaceFavorites() {
    return getList(marketplaceFavoritesKey);
  }

  function toggleMarketplaceFavorite(id) {
    return toggleInList(marketplaceFavoritesKey, id);
  }

  function getTrainingProgress() {
    var progress = storage && storage.get ? storage.get(trainingProgressKey, {}) : {};
    return progress && typeof progress === "object" ? progress : {};
  }

  function setTrainingProgress(progress) {
    var value = progress && typeof progress === "object" ? progress : {};

    if (storage && storage.set) {
      storage.set(trainingProgressKey, value);
    }

    if (dashboard.state) {
      dashboard.state.setState({
        trainingProgress: value
      }, {
        type: "training.setProgress"
      });
    }

    return value;
  }

  function toggleTrainingModule(id) {
    var progress = getTrainingProgress();
    progress[id] = !progress[id];

    setTrainingProgress(progress);

    return {
      id: id,
      completed: Boolean(progress[id]),
      progress: progress
    };
  }

  function summarizeTraining() {
    var modules = getTrainingModules();
    var progress = getTrainingProgress();
    var completed = modules.filter(function isComplete(moduleItem) {
      return progress[moduleItem.id];
    }).length;

    return {
      total: modules.length,
      completed: completed,
      percent: modules.length ? Math.round((completed / modules.length) * 100) : 0
    };
  }

  dashboard.resourceStore = {
    getResources: getResources,
    getMarketplaceOffers: getMarketplaceOffers,
    getTrainingModules: getTrainingModules,
    getResourceFavorites: getResourceFavorites,
    toggleResourceFavorite: toggleResourceFavorite,
    getMarketplaceFavorites: getMarketplaceFavorites,
    toggleMarketplaceFavorite: toggleMarketplaceFavorite,
    getTrainingProgress: getTrainingProgress,
    setTrainingProgress: setTrainingProgress,
    toggleTrainingModule: toggleTrainingModule,
    summarizeTraining: summarizeTraining
  };
})(window);
