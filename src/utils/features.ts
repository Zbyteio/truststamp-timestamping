import fdb from './featureDatabase';

interface FeatureRow {
  id: number;
  email: string;
  title: string;
  description: string;
  org: string;
  repo: string;
  branch: string;
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

export const getFeatureId = (email: string, title: string, description: string, org: string, repo: string, branch: string): number => {
  const stmt = fdb.prepare('SELECT id FROM features WHERE email = ? AND title = ? AND description = ?');
  const row = stmt.get(email, title, description) as FeatureRow | undefined;

  if (row) {
    return row.id;
  } else {
    const insertStmt = fdb.prepare('INSERT INTO features (email, title, description, org, repo, branch) VALUES (?, ?, ?, ?, ?, ?)');
    const info = insertStmt.run(email, title, description, org, repo, branch);
    return info.lastInsertRowid as number;
  }
};

export const updateFeatureCron = (featureId: number, originalFileName: string, randomizedFileName: string, transactionHash: string): void => {
  const updateFile = fdb.prepare(`
    INSERT INTO files (feature_id, original_file_name, randomized_file_name, transaction_hash)
    VALUES (?, ?, ?, ?)
    ON CONFLICT (id) DO UPDATE SET
      original_file_name = excluded.original_file_name,
      randomized_file_name = excluded.randomized_file_name,
      transaction_hash = excluded.transaction_hash
  `);

  updateFile.run(featureId, originalFileName, randomizedFileName, transactionHash);
}

  export const getFeature = (id: number): FeatureRow | undefined => {
    return fdb.prepare('SELECT * FROM features WHERE id = ?').get(id) as FeatureRow | undefined;
  };

  export const storeFeature = (email: string, title: string, description: string, org: string, repo: string, branch: string, fileNames: { originalName: string, random: string, transactionHash: string }[]): void => {
    const featureId = getFeatureId(email, title, description, org, repo, branch);

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

  export const deleteGitHubPathsForFeature = (featureId: number): void => {
    fdb.prepare('DELETE FROM github_paths WHERE feature_id = ?').run(featureId);
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
      const { files, githubPaths } = getFilesAndPathsForFeature(feature.id);
      return {
        feature,
        files,
        githubPaths
      };
    });
  };

  export const getFilesAndPathsForFeature = (id: number): { files: { originalName: string, random: string, transactionHash: string }[], githubPaths: { path: string, type: string }[] } => {
    const files = getFilesByFeatureId(id).map(file => ({ originalName: file.original_file_name, random: file.randomized_file_name, transactionHash: file.transaction_hash }));
    const githubPaths = getGitHubPathsByFeatureId(id).map(path => ({ path: path.path, type: path.type }));
    return { files, githubPaths };
  };
