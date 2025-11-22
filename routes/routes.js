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
  getLandlordConversation
} from "../controller/landlordController.js";

import {
  getPropertyType,
  getListedProperties,
  getOccupationType,
  createConvesation,
  sendMessage,
  getMessages,
  createTenancy,
  getUserTenancies,
  updateTenancyStatus
} from "../controller/appController.js";

import {
  getTenantProfile,
  getTenantSaveListing,
  tenantSaveListing,
  tenantRemoveListing,
  EditTenantProfile,
  getTenantConversation
} from "../controller/tenantController.js";

export const router = express.Router();

router.get("/occupantion-type", getOccupationType);

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
router.get("/tenant-profile/:id", getTenantProfile);
router.post("/edit-tenant-profile", EditTenantProfile)
router.post("/start-conversation", createConvesation);
router.get("/tenant/get-conversations/:id", getTenantConversation)
router.get("/landlord/get-conversations/:id", getLandlordConversation)

router.post("/send-message/:id", sendMessage);
router.get("/get-messages/:id", getMessages);
router.post("/tenancy", createTenancy)
router.get("/get-tenancies/:id", getUserTenancies);
router.patch("/update-tenancy-status/:id", updateTenancyStatus)