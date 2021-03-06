import config from "../../../../config";
import { SearchService, ListingsService } from "../../../services";
import { StringUtils } from "../../../utils";

export const get_html_page = (req, res) =>
  SearchService.find({
    tags: (req.query.tags && req.query.tags.split(",")) || [],
    distance:
      (req.query.distance !== "any" && parseFloat(req.query.distance)) || null,
    location:
      (req.query.lat &&
        req.query.lon && {
          lat: parseFloat(req.query.lat),
          lon: parseFloat(req.query.lon)
        }) ||
      null,
    listing: req.query.listing || null,
    skip: (parseInt(req.params.page, 10) - 1) * 12,
    limit: 12
  })
    .then(r => {
      let pageNo = parseInt(req.params.page, 10);
      let tags =
        (r.tags && r.tags.map(t => t.name).join(", ")) || "Experiences";
      let distance =
        (req.query.distance && `within ${req.query.distance}km from`) ||
        "around";
      let place = req.query.place || "you";
      let query =
        "?" +
        Object.keys(req.query)
          .map(q => `${q}=${req.query[q]}`)
          .join("&");
      res.render("search", {
        title: `${tags} ${distance} ${place} - BoredPass`,
        authentication: req.authentication,
        moment: require("moment"),
        marked: require("marked"),
        results: r.listings,
        recommended: r.recommended,
        skip: (pageNo - 1) * 12,
        limit: 12,
        makeUrlFriendly: StringUtils.makeUrlFriendly,
        search: {
          tags: r.tags,
          distance: req.query.distance,
          location: (r.listing && r.listing.name) || req.query.place,
          category:
            (r.category &&
              r.category[0] &&
              r.category[0]
                .replace(/\s/g, "-")
                .replace("&", "and")
                .toLowerCase()) ||
            "home",
          listing: r.listing
        },
        location: r.location,
        calculateBearing: ListingsService.calculateBearing,
        prevLink: pageNo > 1 && `/search/${pageNo - 1}${query}`,
        nextLink:
          (!r.recommended || !r.recommended.length) &&
          `/search/${pageNo + 1}${query}`,
        categories: req.listing_categories
      });
    })
    .catch(err =>
      res.status(500).render("error", {
        error: {
          status: 500,
          stack: config.app.debug && err.stack
        },
        message: `Something unexpected happened: ${err}`,
        categories: req.listing_categories,
        moment: require("moment")
      })
    );
