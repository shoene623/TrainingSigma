// ...existing code...

// Example of a corrected request to the 'educators' table
const { data, error } = await supabase
  .from('educators')
  .select('pkEducatorID')
  .eq('pkEducatorID', '68896f41-d036-4009-a2cb-ec02671aca78'); // Assuming pkEducatorID is the unique identifier

if (error) {
  console.error('Error fetching educators:', error);
} else {
  console.log('Educators data:', data);
}

// Example of a corrected request to the 'admins' table
const { data: adminData, error: adminError } = await supabase
  .from('admins')
  .select('id')
  .eq('auth_id', '68896f41-d036-4009-a2cb-ec02671aca78');

if (adminError) {
  console.error('Error fetching admins:', adminError);
} else {
  console.log('Admins data:', adminData);
}

// Example of a corrected request to the 'trainingLog' table
const { data: trainingLogData, error: trainingLogError } = await supabase
  .from('trainingLog')
  .select('pkTrainingLogID, dateofclass, fkEducatorID, educators:fkEducatorID(first, last)')
  .order('dateofclass', { ascending: true })
  .limit(5);

if (trainingLogError) {
  console.error('Error fetching training log:', trainingLogError);
} else {
  console.log('Training log data:', trainingLogData);
}

// ...existing code...
