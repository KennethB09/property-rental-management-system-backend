import express from "express";

import {
  checkUserIfCompletedAccountSetup,
  completeAccountSetup,
  getProfile,
  EditLandlordProfile,
  listProperty,
  getLandlordProperties,
  EditLandlordProperty,
  deleteProperty,
  countLandlordPropertiesAndGetStatus,
} from "../controller/landlordController.js";

import {
  getPropertyType,
  getListedProperties,
} from "../controller/appController.js";

import {
  getTenantSaveListing,
  tenantSaveListing,
  tenantRemoveListing,
} from "../controller/tenantController.js";

export const router = express.Router();

router.get("/check-setup/:id", checkUserIfCompletedAccountSetup);
router.post("/complete-setup", completeAccountSetup);
router.get("/get-profile/:id", getProfile);
router.post("/edit-landlord-profile", EditLandlordProfile);
router.post("/landlord-list-property", listProperty);
router.get("/landlord-get-properties/:id", getLandlordProperties);
router.get("/property-type", getPropertyType);
router.post("/landlord-update-property/:id", EditLandlordProperty);
router.delete("/landlord-delete-property/:id", deleteProperty);
router.get(
  "/landlord-count-properties/:id",
  countLandlordPropertiesAndGetStatus
);
router.get("/listings", getListedProperties);
router.get("/tenant/saves/:id", getTenantSaveListing);
router.post("/tenant/save", tenantSaveListing);
router.delete("/tenant/remove-save/:id", tenantRemoveListing);
