import express from 'express'
import KeywordController from '../controllers/keywordController';
import { handleError } from '../utils/handleError'
import { validateUserAccessToken } from '../middlewares/validateUserAccessToken';
import { getUserFromRequest } from '../utils/getUserFromRequest';
const router = express.Router();

// Create new keyword
// router.post('/create', async (req, res) => {
//   try {
//     const { name, color } = req.body;
//     const keywordId = await KeywordController.createKeyword(
//       name, 
//       color, 
//       await UserController.getUserDataFromRequest(req)
//     );
//     res.status(201).json({ id: keywordId });
//   } catch (error: unknown) {
//     res.status(500).json({ error: (error as any)?.message ? (error as any).message : error });
//   }
// });

// // Get single keyword
// router.get('/:id', async (req, res) => {
//   try {
//     const keyword = await KeywordController.getKeyword(
//       parseInt(req.params.id),
//       await UserController.getUserDataFromRequest(req)
//     );
//     if (!keyword) {
//       return res.status(404).json({ error: 'Keyword not found or access denied' });
//     }
//     res.json(keyword);
//   } catch (error) {
//     // res.status(500).json({ error: error.message });
//     handleError(res, error)
//   }
// });

// // Update keyword
// router.put('/:id', async (req, res) => {
//   try {
//     const success = await KeywordController.updateKeyword(
//       parseInt(req.params.id),
//       await UserController.getUserDataFromRequest(req),
//       req.body
//     );
//     if (!success) {
//       return res.status(403).json({ error: 'Update failed - check permissions' });
//     }
//     res.json({ success: true });
//   } catch (error) {
//     handleError(res, error)
//   }
// });

// // Delete keyword
// router.delete('/:id', async (req, res) => {
//   try {
//     const success = await KeywordController.deleteKeyword(
//       parseInt(req.params.id),
//       await UserController.getUserDataFromRequest(req)
//     );
//     if (!success) {
//       return res.status(403).json({ error: 'Deletion failed - check permissions' });
//     }
//     res.json({ success: true });
//   } catch (error) {
//     handleError(res, error) 
//   }
// });

// // Share keyword with another user
// router.post('/:id/share', async (req, res) => {
//   try {
//     const success = await KeywordController.shareKeyword(
//       parseInt(req.params.id),
//       await UserController.getUserDataFromRequest(req),
//       req.body.targetHandle,
//       req.body.accessLevel || 1
//     );
//     if (!success) {
//       return res.status(403).json({ error: 'Sharing failed - check permissions' });
//     }
//     res.status(201).json({ success: true });
//   } catch (error) {
//     handleError(res, error)
//   }
// });

// List all keywords for user
router.post('/list', async (req, res) => {
  try {
    const user = getUserFromRequest(req as any);
    const keywords = await KeywordController.getUserKeywords(user);
    res.json(keywords);
  } catch (error) {
    // handleError(res, error)
  }
});

export default router;