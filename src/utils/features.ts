import fdb from './featureDatabase';

interface FeatureRow {
  id: number;
  email: string;
  title: string;
  description: string;
}

interface FileRow {
  id: number;
  feature_id: number;
  original_file_name: string;
  randomized_file_name: string;
  transaction_hash: string;
}

interface GitHubPathRow {
  id: number;
  feature_id: number;
  path: string;
  type: string;
}

export const getFeatureId = (email: string, title: string, description: string): number => {
  const stmt = fdb.prepare('SELECT id FROM features WHERE email = ? AND title = ? AND description = ?');
  const row = stmt.get(email, title, description) as FeatureRow | undefined;

  if (row) {
    return row.id;
  } else {
    const insertStmt = fdb.prepare('INSERT INTO features (email, title, description) VALUES (?, ?, ?)');
    const info = insertStmt.run(email, title, description);
    return info.lastInsertRowid as number;
  }
};

export const storeFeature = (email: string, title: string, description: string, fileNames: { originalName: string, random: string, transactionHash: string }[]): void => {
  const featureId = getFeatureId(email, title, description);

  const insertFile = fdb.prepare(`
    INSERT INTO files (feature_id, original_file_name, randomized_file_name, transaction_hash)
    VALUES (?, ?, ?, ?)
  `);

  fileNames.forEach((file) => {
    if (!file.originalName || !file.random || !file.transactionHash) {
      console.error('Invalid file data:', file);
    } else {
      insertFile.run(featureId, file.originalName, file.random, file.transactionHash);
    }
  });
};

export const storeGitHubPath = (featureId: number, path: string, type: string): void => {
  const insertPath = fdb.prepare(`
    INSERT INTO github_paths (feature_id, path, type)
    VALUES (?, ?, ?)
  `);
  insertPath.run(featureId, path, type);
};

export const getFeaturesByEmail = (email: string): FeatureRow[] => {
  const stmt = fdb.prepare('SELECT * FROM features WHERE email = ?');
  const rows = stmt.all(email) as FeatureRow[];
  return rows;
};

export const getFilesByFeatureId = (featureId: number): FileRow[] => {
  const stmt = fdb.prepare('SELECT * FROM files WHERE feature_id = ?');
  const rows = stmt.all(featureId) as FileRow[];
  return rows;
};

export const getGitHubPathsByFeatureId = (featureId: number): GitHubPathRow[] => {
  const stmt = fdb.prepare('SELECT * FROM github_paths WHERE feature_id = ?');
  const rows = stmt.all(featureId) as GitHubPathRow[];
  return rows;
};

export const getFeaturesWithFilesAndPathsByEmail = (email: string): { feature: FeatureRow, files: { originalName: string, random: string, transactionHash: string }[], githubPaths: { path: string, type: string }[] }[] => {
  const features = getFeaturesByEmail(email);
  return features.map(feature => {
    const files = getFilesByFeatureId(feature.id).map(file => ({ originalName: file.original_file_name, random: file.randomized_file_name, transactionHash: file.transaction_hash }));
    const githubPaths = getGitHubPathsByFeatureId(feature.id).map(path => ({ path: path.path, type: path.type }));
    return {
      feature,
      files,
      githubPaths
    };
  });
};