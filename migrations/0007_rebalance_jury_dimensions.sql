-- 技术实现由 25 分改为 20 分、表达与故事由 5 分改为 10 分；
-- 对已经提交的评分等比例换算，保持原有评分相对关系与总分。
UPDATE jury_scores
SET
  technical_execution = ROUND(technical_execution * 0.8, 1),
  storytelling = ROUND(storytelling * 2, 1),
  total = ROUND(human_impact + innovation + (technical_execution * 0.8) + product_experience + productization + (storytelling * 2), 1),
  updated_at = CURRENT_TIMESTAMP;
