import express from 'express'
import KeywordController from '../controllers/keywordController';
import { handleError } from '../utils/handleError'
import { validateUserAccessToken } from '../middlewares/validateUserAccessToken';
import { getUserFromRequest } from '../utils/getUserFromRequest';
import { patchAUBackUrlHeader } from '../middlewares/patchAUBackUrlHeader';
import { getAUBackUrlFromRequest } from '../utils/getAUBackUrlFromRequest';
import { dd } from '../utils/dd';
const router = express.Router();

router.post('/list', async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    const keywords = await KeywordController.getUserKeywords(user);
    res.json(keywords);
  } catch (error) {
    // handleError(res, error)
  }
});

router.post('/create', async (req, res) => {
  try {
    const { name, color } = req.body;
    const keywordId = await KeywordController.createKeyword(
      name, 
      color, 
      getUserFromRequest(req)
    );
    res.status(201).json({ id: keywordId });
  } catch (error: unknown) {
    res.status(500).json({ error: (error as any)?.message ? (error as any).message : error });
  }
});

router.post('/delete', async (req, res) => {
  try {
    const { id } = req.body;
    const user = getUserFromRequest(req);
    const success = await KeywordController.deleteKeyword(
      id,
      user
    );
    if (!success) {
      return res.status(403).json({ error: 'Deletion failed - check permissions' });
    }
    res.json({ success: true });
  } catch (error) {
    // handleError(res, error) 
  }
});

// Get single keyword
router.post('/get-one', async (req, res) => {
  const { id } = req.body;
  const user = getUserFromRequest(req);
  try {
    const keyword = await KeywordController.getKeyword(
      id,
      user
    );
    if (!keyword) {
      return res.status(404).json({ error: 'Keyword not found or access denied' });
    }
    res.json(keyword);
  } catch (error) {
    // res.status(500).json({ error: error.message });
    handleError(res, error)
  }
});

// // Update keyword
router.post('/update', async (req, res) => {
  // const userHandler = getUserFromRequest(req)
  // const { id, name, color } = req.body;
  // try {
  //   const success = await KeywordController.updateKeyword(
  //     id,
  //     userHandler,
  //     { name, color }
  //   );
  //   if (!success) {
  //     return res.status(403).json({ error: 'Update failed - check permissions' });
  //   }
  //   res.json({ success: true });
  // } catch (error) {
  //   handleError(res, error)
  // }
  res.status(503).json({ error: 'not implemented' });
});

// Share keyword with another user
router.post('/share', patchAUBackUrlHeader, async (req, res) => {
  try {
    const success = await KeywordController.shareKeyword(
      getUserFromRequest(req),
      req.body.keywordId,
      req.body.targetUserProviderId,
      req.body.targetUserId,
      req.body.accessLevel,
      req
    );
    if (!success) {
      return res.status(403).json({ error: 'Sharing failed - check permissions' });
    }
    res.status(201).json({ success: true });
  } catch (error) {
    handleError(res, error)
  }
});


export default router;